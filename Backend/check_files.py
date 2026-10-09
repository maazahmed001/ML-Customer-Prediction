# test_cnn_files.py
import os

print("Checking CNN files...")
models_dir = "models"

# List all files
print("\nAll files in models directory:")
for f in os.listdir(models_dir):
    print(f"  - {f}")

# Check for .h5 files
h5_files = [f for f in os.listdir(models_dir) if f.endswith('.h5')]
print(f"\n.h5 files found: {h5_files}")

# Check for class files
class_files = [f for f in os.listdir(models_dir) if 'class' in f.lower() and f.endswith('.pkl')]
print(f"Class files found: {class_files}")

# If you have a .h5 file but different name
if h5_files and h5_files[0] != "fashion_mnist_cnn.h5":
    print(f"\n⚠️  Found CNN model with different name: {h5_files[0]}")
    print(f"   Rename it to 'fashion_mnist_cnn.h5'")

if class_files and class_files[0] != "class_names.pkl":
    print(f"\n⚠️  Found class names with different name: {class_files[0]}")
    print(f"   Rename it to 'class_names.pkl'")