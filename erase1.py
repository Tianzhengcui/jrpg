from PIL import Image

input_path = "assets/daxi(1).png"
output_path = "assets/player.png"

img = Image.open(input_path).convert("RGBA")
data = img.getdata()

new_data = []

for item in data:
    r, g, b, a = item

    threshold = 220

    if r > threshold and g > threshold and b > threshold:
        new_data.append((255,255,255,0))
    else:
        new_data.append((r,g,b,a))


img.putdata(new_data)
img.save(output_path)

print("Done: saved to", output_path)
