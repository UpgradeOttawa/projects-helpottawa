#!/usr/bin/env python3
"""
Enhanced Renovation Vision Analysis with YOLO Object Detection
Detects actual objects (toilets, sinks, people, etc.) instead of just shapes
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from PIL import Image
import hashlib
from ultralytics import YOLO
import cv2
import numpy as np

# Import V3-Butterfly for supplementary shape analysis
sys.path.append(str(Path(__file__).parent / 'V3-Butterfly'))
from main import ButterflyAnalyzer

class EnhancedRenovationAnalyzer:
    """Combines YOLO object detection with V3-Butterfly shape analysis"""
    
    # COCO class names that matter for renovation
    RENOVATION_OBJECTS = {
        # People (skip these images)
        'person': 'people',
        
        # Bathroom fixtures
        'toilet': 'bathroom',
        'sink': 'bathroom',
        
        # Kitchen appliances
        'refrigerator': 'kitchen',
        'oven': 'kitchen',
        'microwave': 'kitchen',
        
        # Furniture (helps classify rooms)
        'chair': 'living_room',
        'couch': 'living_room',
        'bed': 'bedroom',
        'dining table': 'dining_room',
        
        # Other relevant objects
        'tv': 'living_room',
        'laptop': 'office',
    }
    
    def __init__(self):
        """Initialize YOLO model and V3-Butterfly"""
        print("Loading YOLO model...")
        self.yolo = YOLO('yolov8n.pt')  # Nano model - fast and accurate enough
        
        print("Loading V3-Butterfly...")
        self.butterfly = ButterflyAnalyzer()
        
        print("✓ Models loaded\n")
    
    def detect_objects(self, image_path):
        """
        Detect objects in image using YOLO
        Returns: dict with detected objects and their confidence
        """
        results = self.yolo(image_path, verbose=False)
        
        detected = {}
        for result in results:
            boxes = result.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                label = result.names[cls_id]
                
                if label in self.RENOVATION_OBJECTS:
                    if label not in detected or conf > detected[label]:
                        detected[label] = conf
        
        return detected
    
    def should_skip_image(self, detected_objects):
        """
        Determine if image should be skipped
        Skip if: contains people
        """
        return 'person' in detected_objects
    
    def classify_room_from_objects(self, detected_objects):
        """
        Classify room type based on detected objects
        Returns: (room_type, confidence, reasoning)
        """
        if not detected_objects:
            return 'general_renovation', 0.50, 'No objects detected'
        
        # Remove people from consideration
        objects = {k: v for k, v in detected_objects.items() if k != 'person'}
        
        if not objects:
            return 'general_renovation', 0.50, 'Only people detected'
        
        # Bathroom detection (highest priority - very specific)
        bathroom_objects = ['toilet', 'sink']
        bathroom_score = sum([objects.get(obj, 0) for obj in bathroom_objects])
        
        if bathroom_score > 0.5:
            reasoning = f"Detected: {', '.join([k for k in objects.keys() if k in bathroom_objects])}"
            return 'bathroom', min(bathroom_score, 0.95), reasoning
        
        # Kitchen detection
        kitchen_objects = ['refrigerator', 'oven', 'microwave', 'sink']
        kitchen_score = sum([objects.get(obj, 0) for obj in kitchen_objects])
        
        if kitchen_score > 0.5:
            reasoning = f"Detected: {', '.join([k for k in objects.keys() if k in kitchen_objects])}"
            return 'kitchen', min(kitchen_score, 0.95), reasoning
        
        # Living room
        living_objects = ['couch', 'tv', 'chair']
        living_score = sum([objects.get(obj, 0) for obj in living_objects])
        
        if living_score > 0.5:
            reasoning = f"Detected: {', '.join([k for k in objects.keys() if k in living_objects])}"
            return 'living_room', min(living_score, 0.85), reasoning
        
        # Bedroom
        if 'bed' in objects:
            return 'bedroom', objects['bed'], 'Detected: bed'
        
        # Dining room
        if 'dining table' in objects:
            return 'dining_room', objects['dining table'], 'Detected: dining table'
        
        # Default - general renovation
        obj_list = ', '.join(objects.keys())
        return 'general_renovation', 0.60, f"Detected: {obj_list}"
    
    def extract_renovation_features(self, detected_objects):
        """
        Extract renovation-specific features from detected objects
        Returns: list of (feature_type, confidence)
        """
        features = []
        
        # Fixtures
        fixtures = ['toilet', 'sink']
        if any(obj in detected_objects for obj in fixtures):
            conf = max([detected_objects.get(obj, 0) for obj in fixtures])
            features.append(('fixtures', conf))
        
        # Appliances
        appliances = ['refrigerator', 'oven', 'microwave']
        if any(obj in detected_objects for obj in appliances):
            conf = max([detected_objects.get(obj, 0) for obj in appliances])
            features.append(('appliances', conf))
        
        return features
    
    def analyze_photo(self, image_path):
        """
        Complete photo analysis combining YOLO and V3-Butterfly
        Returns: dict with all analysis data
        """
        image_path = Path(image_path)
        
        print(f"\n{'='*60}")
        print(f"Analyzing: {image_path.name}")
        print(f"{'='*60}")
        
        # Step 1: YOLO object detection
        print("[1/6] Running YOLO object detection...")
        detected_objects = self.detect_objects(str(image_path))
        
        if detected_objects:
            print(f"  ✓ Objects detected: {len(detected_objects)}")
            for obj, conf in detected_objects.items():
                print(f"    • {obj} ({conf:.2f})")
        else:
            print("  ⚠ No relevant objects detected")
        
        # Step 2: Check if should skip
        if self.should_skip_image(detected_objects):
            print("  ⚠ SKIPPING: People detected in image")
            return None
        
        # Step 3: Classify room
        print("[2/6] Classifying room type...")
        room_type, confidence, reasoning = self.classify_room_from_objects(detected_objects)
        print(f"  ✓ Room type: {room_type} ({confidence:.2f})")
        print(f"  ✓ Reasoning: {reasoning}")
        
        # Step 4: Extract features
        print("[3/6] Extracting renovation features...")
        features = self.extract_renovation_features(detected_objects)
        print(f"  ✓ Features found: {len(features)}")
        for feature, conf in features:
            print(f"    • {feature} ({conf:.2f})")
        
        # Step 5: V3-Butterfly supplementary analysis
        print("[4/6] Running V3-Butterfly shape analysis...")
        butterfly_result = self.butterfly.analyze(str(image_path))
        print(f"  ✓ Shapes detected: {butterfly_result['shapes_detected']}")
        print(f"  ✓ Resonance points: {butterfly_result['resonance_points']}")
        print(f"  ✓ Processing time: {butterfly_result['processing_time_ms']:.2f}ms")
        
        # Step 6: Extract EXIF
        print("[5/6] Extracting EXIF data...")
        exif_data = self._extract_exif(image_path)
        if exif_data.get('gps'):
            print(f"  ✓ GPS: ({exif_data['gps']['lat']}, {exif_data['gps']['lng']})")
        else:
            print("  ⚠ No GPS data")
        
        # Step 7: Calculate quality scores
        print("[6/6] Calculating quality scores...")
        quality = self._calculate_quality(butterfly_result, detected_objects)
        complexity = butterfly_result['shapes_detected'] / 150.0
        complexity = min(max(complexity, 0.0), 1.0)
        print(f"  ✓ Quality: {quality:.2f}")
        print(f"  ✓ Complexity: {complexity:.2f}")
        
        print("\n✓ Analysis complete!")
        print(f"{'='*60}\n")
        
        # Compile result
        result = {
            'filename': image_path.name,
            'file_path': str(image_path),
            'sha256': self._calculate_hash(image_path),
            
            # YOLO results
            'detected_objects': detected_objects,
            'room_type': room_type,
            'room_confidence': confidence,
            'classification_reasoning': reasoning,
            
            # Features
            'features': [
                {
                    'type': ftype,
                    'confidence': fconf,
                    'detection_method': 'yolo'
                }
                for ftype, fconf in features
            ],
            
            # V3-Butterfly results (supplementary)
            'shapes_detected': butterfly_result['shapes_detected'],
            'resonance_points': butterfly_result['resonance_points'],
            'processing_time_ms': butterfly_result['processing_time_ms'],
            
            # EXIF
            'exif': exif_data,
            
            # Scores
            'quality_score': quality,
            'complexity_score': complexity,
            
            'analyzed_at': datetime.utcnow().isoformat()
        }
        
        return result
    
    def _extract_exif(self, image_path):
        """Extract EXIF data including GPS"""
        try:
            img = Image.open(image_path)
            exif = img._getexif() or {}
            
            result = {}
            
            # GPS
            if 34853 in exif:  # GPSInfo tag
                gps_info = exif[34853]
                if 2 in gps_info and 4 in gps_info:  # Lat and Lng
                    lat = self._convert_gps(gps_info[2], gps_info[1])
                    lng = self._convert_gps(gps_info[4], gps_info[3])
                    result['gps'] = {'lat': lat, 'lng': lng}
            
            # Date
            if 36867 in exif:  # DateTimeOriginal
                result['date_taken'] = exif[36867]
            
            # Camera
            if 272 in exif:  # Model
                result['camera_model'] = exif[272]
            
            return result
            
        except Exception as e:
            return {}
    
    def _convert_gps(self, coords, ref):
        """Convert GPS coordinates from EXIF format to decimal"""
        degrees = coords[0]
        minutes = coords[1]
        seconds = coords[2]
        
        decimal = float(degrees) + float(minutes)/60 + float(seconds)/3600
        
        if ref in ['S', 'W']:
            decimal = -decimal
        
        return decimal
    
    def _calculate_quality(self, butterfly_result, detected_objects):
        """Calculate quality score based on both analyses"""
        # Base quality from V3-Butterfly
        base_quality = min(butterfly_result['resonance_points'] / 5.0, 1.0)
        
        # Boost if clear objects detected
        if len(detected_objects) >= 2:
            base_quality = min(base_quality + 0.3, 1.0)
        
        return round(base_quality, 2)
    
    def _calculate_hash(self, image_path):
        """Calculate SHA256 hash of image"""
        with open(image_path, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()

def main():
    """CLI interface"""
    if len(sys.argv) < 2:
        print("Usage: python renovation_vision_yolo.py <image_path> [--output output.json]")
        sys.exit(1)
    
    image_path = sys.argv[1]
    output_path = None
    
    if '--output' in sys.argv:
        output_path = sys.argv[sys.argv.index('--output') + 1]
    
    # Analyze
    analyzer = EnhancedRenovationAnalyzer()
    result = analyzer.analyze_photo(image_path)
    
    if result is None:
        print("\n⚠ Image skipped (contains people)")
        sys.exit(1)
    
    # Save if requested
    if output_path:
        with open(output_path, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"\nResults saved to: {output_path}")
    
    return result

if __name__ == '__main__':
    main()