import sys
import json
import base64
import tempfile
import os
import pypdfium2 as pdfium
from paddleocr import PaddleOCR

def process_pdf(pdf_path):
    images = []
    pdf = pdfium.PdfDocument(pdf_path)
    for i in range(len(pdf)):
        page = pdf.get_page(i)
        # Render at 300 DPI
        bitmap = page.render(scale=300/72.0)
        pil_image = bitmap.to_pil()

        temp_img = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        pil_image.save(temp_img.name)
        images.append(temp_img.name)
    return images

def main():
    temp_files = []
    try:
        input_data = sys.stdin.read()
        if not input_data:
            return

        data = json.loads(input_data)
        file_path = data.get('file_path')
        mime_type = data.get('mime_type')

        if not file_path:
            print(json.dumps({"error": "No file path provided"}))
            return

        ocr = PaddleOCR(use_textline_orientation=True, lang='pt')

        images_to_process = []
        if mime_type == 'application/pdf':
            images_to_process = process_pdf(file_path)
            temp_files.extend(images_to_process)
        else:
            images_to_process = [file_path]

        output = {"pages": []}
        page_num = 1

        for img_path in images_to_process:
            result = ocr.ocr(img_path, cls=True)

            page_text = []
            if result and result[0]:
                for res in result:
                    if res:
                        for line in res:
                            text = line[1][0]
                            confidence = float(line[1][1])
                            box = line[0]
                            page_text.append({
                                "text": text,
                                "confidence": confidence,
                                "box": box
                            })

            output["pages"].append({
                "page": page_num,
                "lines": page_text
            })
            page_num += 1

        print(json.dumps(output))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
    finally:
        for f in temp_files:
            if os.path.exists(f):
                os.remove(f)

if __name__ == '__main__':
    main()
