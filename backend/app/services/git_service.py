import os
import re
import shutil
import zipfile
import git
from typing import Tuple

MAX_ZIP_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB limit

class GitService:
    @staticmethod
    def normalize_github_url(raw_url: str, branch: str = "main") -> Tuple[str, str]:
        """Normalizes various GitHub URL formats into a cloneable HTTPS URL and extracts branch if present"""
        clean_url = raw_url.strip().rstrip("/")
        detected_branch = branch

        if clean_url.startswith("git@github.com:"):
            clean_url = "https://github.com/" + clean_url.replace("git@github.com:", "")
        elif not clean_url.startswith("http://") and not clean_url.startswith("https://"):
            clean_url = "https://" + clean_url

        # Check if URL contains /tree/<branch> or /blob/<branch>
        tree_match = re.search(r"^(https?://github\.com/[^/]+/[^/]+)/(?:tree|blob)/([^/]+)", clean_url)
        if tree_match:
            clean_url = tree_match.group(1)
            detected_branch = tree_match.group(2)

        # Strip .git suffix if present for clean comparison
        if clean_url.endswith(".git"):
            clean_url = clean_url[:-4]

        return clean_url, detected_branch

    @staticmethod
    def clone_repository(github_url: str, target_dir: str, branch: str = "main") -> Tuple[bool, str]:
        """Clones a GitHub repository safely with shallow depth and automatic branch fallback"""
        try:
            if os.path.exists(target_dir):
                shutil.rmtree(target_dir, ignore_errors=True)
            os.makedirs(target_dir, exist_ok=True)
            
            clean_url, target_branch = GitService.normalize_github_url(github_url, branch)
            
            if not ("github.com/" in clean_url.lower() or "gitlab.com/" in clean_url.lower()):
                return False, "Invalid repository URL. Must be a valid GitHub or GitLab repository link."
            
            # Clone with depth=1 for speed, low memory, and minimal disk footprint
            try:
                git.Repo.clone_from(
                    clean_url,
                    target_dir,
                    branch=target_branch,
                    depth=1,
                    single_branch=True
                )
                return True, f"Successfully cloned repository branch '{target_branch}'"
            except Exception:
                # Fallback: Clone default repository branch without explicit branch name
                git.Repo.clone_from(
                    clean_url,
                    target_dir,
                    depth=1,
                    single_branch=True
                )
                return True, "Successfully cloned default repository branch"
        except Exception as e:
            return False, f"Git clone failed: {str(e)}"

    @staticmethod
    def extract_zip(zip_path: str, target_dir: str) -> Tuple[bool, str]:
        """Safely extracts ZIP archive preventing Zip-Slip (path traversal) vulnerability"""
        try:
            if os.path.exists(target_dir):
                shutil.rmtree(target_dir)
            os.makedirs(target_dir, exist_ok=True)
            
            # Check file size
            if os.path.getsize(zip_path) > MAX_ZIP_SIZE_BYTES:
                return False, "ZIP file exceeds maximum allowed size (50MB)"
                
            target_dir_abs = os.path.abspath(target_dir)
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                for member in zip_ref.infolist():
                    # Security check: Prevent Zip Slip (e.g., ../../evil.sh)
                    member_path = os.path.abspath(os.path.join(target_dir, member.filename))
                    if not member_path.startswith(target_dir_abs):
                        return False, f"Malicious archive detected: Path traversal attempt '{member.filename}'"
                
                zip_ref.extractall(target_dir)
                
            # If zip contained a single root folder, unnest it
            extracted_items = [os.path.join(target_dir, item) for item in os.listdir(target_dir)]
            if len(extracted_items) == 1 and os.path.isdir(extracted_items[0]):
                single_folder = extracted_items[0]
                for item in os.listdir(single_folder):
                    shutil.move(os.path.join(single_folder, item), target_dir)
                os.rmdir(single_folder)
                
            return True, "Successfully extracted archive"
        except zipfile.BadZipFile:
            return False, "Invalid or corrupted ZIP file"
        except Exception as e:
            return False, f"Extraction failed: {str(e)}"
