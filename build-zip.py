import os
import zipfile

def build_zip():
    plugin_slug = 'institute-management-system'
    version = '1.2.0'
    zip_filename = f'{plugin_slug}-v{version}.zip'
    fallback_filename = f'{plugin_slug}.zip'

    root_dir = os.path.dirname(os.path.abspath(__file__))

    # Files and directories to include
    include_files = [
        'institute-management-system.php',
        'uninstall.php',
        'INSTALL.md',
    ]

    include_dirs = [
        'includes',
        'assets/dist',
    ]

    print(f"Building cross-platform release zip: {zip_filename}...")

    def create_archive(target_filename):
        with zipfile.ZipFile(os.path.join(root_dir, target_filename), 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add top-level files
            for f in include_files:
                file_path = os.path.join(root_dir, f)
                if os.path.exists(file_path):
                    # Force POSIX forward slash for zip entry name
                    arcname = f"{plugin_slug}/{f}".replace('\\', '/')
                    zipf.write(file_path, arcname)
                    print(f"  + {arcname}")

            # Add directory files
            for d in include_dirs:
                dir_path = os.path.join(root_dir, d)
                if os.path.exists(dir_path):
                    for root, _, files in os.walk(dir_path):
                        for file in files:
                            if file.endswith('.map'):
                                continue
                            full_path = os.path.join(root, file)
                            rel_path = os.path.relpath(full_path, root_dir)
                            # Force POSIX forward slash for zip entry name
                            arcname = f"{plugin_slug}/{rel_path}".replace('\\', '/')
                            zipf.write(full_path, arcname)
                            print(f"  + {arcname}")

    create_archive(zip_filename)
    create_archive(fallback_filename)
    print("Release Zip created successfully with POSIX forward slashes!")

if __name__ == '__main__':
    build_zip()
