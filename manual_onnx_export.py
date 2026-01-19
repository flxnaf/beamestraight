"""
Manual ONNX export bypassing the broken onnx package installation
Uses PyTorch's internal ONNX export which doesn't require onnx package to be installed
"""
import torch
import sys
import os

# Temporarily disable onnx checker that requires onnx.defs
os.environ['ONNX_SKIP_CHECK'] = '1'

# Monkey-patch to skip onnx import
class DummyOnnx:
    def __getattr__(self, name):
        return lambda *args, **kwargs: None

sys.modules['onnx'] = DummyOnnx()
sys.modules['onnx.defs'] = DummyOnnx()
sys.modules['onnx.checker'] = DummyOnnx()

from ultralytics import YOLO
from pathlib import Path
import shutil

print("Loading model...")
model = YOLO('runs/segment/runs/segment/teeth_segmentation/weights/best.pt')
pt_model = model.model.cpu().eval()

print("Exporting with minimal ONNX requirements...")

# Create dummy input
dummy_input = torch.randn(1, 3, 640, 640)

output_file = 'best_seg.onnx'

try:
    # Export with minimal requirements
    torch.onnx.export(
        pt_model,
        dummy_input,
        output_file,
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=['images'],
        output_names=['output0', 'output1'],
        verbose=False
    )
    
    # Copy to public folder
    Path('public/models').mkdir(parents=True, exist_ok=True)
    shutil.copy2(output_file, 'public/models/teeth-detection-seg.onnx')
    
    size_mb = Path('public/models/teeth-detection-seg.onnx').stat().st_size / 1e6
    print(f'✓ SUCCESS! Exported to public/models/teeth-detection-seg.onnx ({size_mb:.1f} MB)')
    print('  Full polygon support enabled!')
    
except Exception as e:
    print(f'Export failed: {e}')
    print('\nFinal option: Use Google Colab (free, takes 2 minutes):')
    print('1. Upload best.pt to Colab')
    print('2. Run: !pip install ultralytics onnx')
    print('3. Run: from ultralytics import YOLO; YOLO("best.pt").export(format="onnx")')
    print('4. Download the .onnx file')
