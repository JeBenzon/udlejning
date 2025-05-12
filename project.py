import os

output_filename = "combined_code.txt"
target_extensions = (".ts", ".tsx", ".mdx", ".mjs")
include_specific_files = {"package.json", "tsconfig.json", "components.json"}
exclude_specific_files = {"package-lock.json"}
exclude_dirs = {"node_modules", ".next"}

# Ensure the output file is empty before starting
if os.path.exists(output_filename):
    os.remove(output_filename)

with open(output_filename, "w", encoding="utf-8") as outfile:
    # Walk through the directory tree starting from the current directory '.'
    for root, dirs, files in os.walk(".", topdown=True):
        # Modify dirs in-place to prevent os.walk from descending into excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]

        for filename in files:
            # Skip explicitly excluded files
            if filename in exclude_specific_files:
                continue

            # Check if the file should be included based on extension or specific name
            should_include = False
            if filename.endswith(target_extensions):
                should_include = True
            elif filename in include_specific_files:
                should_include = True

            if should_include:
                filepath = os.path.join(root, filename)
                # Normalize path separators for consistency
                normalized_path = os.path.normpath(filepath)
                try:
                    # Write the header with the file path
                    outfile.write(f"\n--- File: {normalized_path} ---\n\n")
                    # Read the content of the current file and write it to the output file
                    with open(filepath, "r", encoding="utf-8", errors="ignore") as infile:
                        outfile.write(infile.read())
                except Exception as e:
                    print(f"Error processing file {normalized_path}: {e}")

print(f"Combined file created: {output_filename}")
