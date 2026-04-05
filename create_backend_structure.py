import os

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

# Create backend directory structure
dirs = [
    'backend',
    'backend\\app',
    'backend\\app\\models',
    'backend\\app\\routers',
    'backend\\app\\schemas',
    'backend\\app\\services',
    'backend\\app\\utils',
    'backend\\app\\middleware',
    'backend\\tests',
    'backend\\uploads'
]

for directory in dirs:
    full_path = os.path.join(script_dir, directory)
    os.makedirs(full_path, exist_ok=True)
    print(f'Created: {full_path}')

print('\n✅ Backend folder structure created successfully!')
print(f'Location: {os.path.join(script_dir, "backend")}')
