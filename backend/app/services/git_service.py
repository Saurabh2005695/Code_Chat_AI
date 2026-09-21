import os
import shutil
import zipfile
import git
from typing import Tuple

MAX_ZIP_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB limit

class GitService:
    @staticmethod
    def clone_repository(github_url: str, target_dir: str, branch: str = "main") -> Tuple[bool, str]:
        """Clones a GitHub repository safely with shallow depth"""
        try:
            if os.path.exists(target_dir):
                shutil.rmtree(target_dir)
            os.makedirs(target_dir, exist_ok=True)
            
            # Clean URL to prevent command injection
            clean_url = github_url.strip()
            if not (clean_url.startswith("https://github.com/") or clean_url.startswith("http://github.com/")):
                return False, "Invalid GitHub repository URL. Must start with https://github.com/"
            
            # Clone with depth=1 for speed and disk economy (kill_after_timeout omitted for Windows compatibility)
            try:
                git.Repo.clone_from(
                    clean_url,
                    target_dir,
                    branch=branch,
                    depth=1
                )
                return True, "Successfully cloned repository"
            except git.GitCommandError:
                # Fallback to cloning without branch specifier if default branch differs
                git.Repo.clone_from(
                    clean_url,
                    target_dir,
                    depth=1
                )
                return True, "Successfully cloned default branch"
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
