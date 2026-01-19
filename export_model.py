from ultralytics import YOLO
import shutil
from pathlib import Path

# Load trained model
model = YOLO('runs/segment/runs/segment/teeth_segmentation/weights/best.pt')

# Export to ONNX
print("Exporting to ONNX...")
model.export(format='onnx', imgsz=640, simplify=True, opset=12, dynamic=False)

# Copy to public folder
Path('public/models').mkdir(parents=True, exist_ok=True)
shutil.copy2('runs/segment/runs/segment/teeth_segmentation/weights/best.onnx', 
             'public/models/teeth-detection-seg.onnx')

size_mb = Path('public/models/teeth-detection-seg.onnx').stat().st_size / 1e6
print(f'✓ Exported to public/models/teeth-detection-seg.onnx ({size_mb:.1f} MB)')
