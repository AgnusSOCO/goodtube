#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

def create_gradient_icon(size, filename):
    # Create image with gradient background
    img = Image.new('RGB', (size, size), '#8B5CF6')
    draw = ImageDraw.Draw(img)
    
    # Create gradient effect
    for y in range(size):
        # Interpolate between purple and pink
        ratio = y / size
        r = int(139 + (236 - 139) * ratio)  # 139 to 236
        g = int(92 + (72 - 92) * ratio)    # 92 to 72  
        b = int(246 + (153 - 246) * ratio) # 246 to 153
        color = (r, g, b)
        draw.line([(0, y), (size, y)], fill=color)
    
    # Add shield shape
    shield_size = int(size * 0.6)
    center_x, center_y = size // 2, size // 2
    
    # Draw white shield background
    shield_points = [
        (center_x, center_y - shield_size//2),
        (center_x + shield_size//3, center_y - shield_size//3),
        (center_x + shield_size//3, center_y + shield_size//4),
        (center_x, center_y + shield_size//2),
        (center_x - shield_size//3, center_y + shield_size//4),
        (center_x - shield_size//3, center_y - shield_size//3),
    ]
    draw.polygon(shield_points, fill='white')
    
    # Add "GT" text for larger icons
    if size >= 32:
        try:
            font_size = max(8, size // 6)
            # Try to use a system font, fallback to default
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
            except:
                font = ImageFont.load_default()
            
            # Get text size and center it
            bbox = draw.textbbox((0, 0), "GT", font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            text_x = center_x - text_width // 2
            text_y = center_y - text_height // 2
            
            draw.text((text_x, text_y), "GT", fill='#8B5CF6', font=font)
        except Exception as e:
            print(f"Could not add text to {size}x{size} icon: {e}")
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

# Create icons directory if it doesn't exist
icons_dir = '/home/ubuntu/goodtube/goodtube-extension/icons'
os.makedirs(icons_dir, exist_ok=True)

# Create all icon sizes
sizes = [16, 32, 48, 128]
for size in sizes:
    filename = os.path.join(icons_dir, f'icon-{size}.png')
    create_gradient_icon(size, filename)

print("All icons created successfully!")

