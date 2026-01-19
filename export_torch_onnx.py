import torch
from ultralytics import YOLO
from pathlib import Path
import shutil

print("Loading trained model...")
model = YOLO('runs/segment/runs/segment/teeth_segmentation/weights/best.pt')

print("Exporting via PyTorch (bypassing onnx package)...")

# Get the PyTorch model
pt_model = model.model.cpu()
pt_model.eval()

# Create dummy input
dummy_input = torch.randn(1, 3, 640, 640)

# Export using torch.onnx.export
output_path = 'runs/segment/runs/segment/teeth_segmentation/weights/best.onnx'
torch.onnx.export(
    pt_model,
    dummy_input,
    output_path,
    export_params=True,
    opset_version=12,
    do_constant_folding=True,
    input_names=['images'],
    output_names=['output0', 'output1'],
    dynamic_axes=None  # Fixed input size for browser
)

# Copy to public folder
Path('public/models').mkdir(parents=True, exist_ok=True)
shutil.copy2(output_path, 'public/models/teeth-detection-seg.onnx')

size_mb = Path('public/models/teeth-detection-seg.onnx').stat().st_size / 1e6
print(f'✓ Exported to public/models/teeth-detection-seg.onnx ({size_mb:.1f} MB)')
print(f'  Model preserves all polygon points for smooth tooth outlines!')
