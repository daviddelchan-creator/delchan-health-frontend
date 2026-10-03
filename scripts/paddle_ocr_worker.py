import sys
import json
import base64
import tempfile
import os
import pypdfium2 as pdfium
from paddleocr import PaddleOCR

def print_error(msg):
    # Logs and debugs must go to stderr
    sys.stderr.write(msg + "\n")

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

def validate_magic_bytes(file_path, expected_mime):
    try:
        with open(file_path, 'rb') as f:
            header = f.read(8)
            if not header:
                return False, "Empty file"

            # PDF magic bytes: %PDF- (25 50 44 46 2D)
            if expected_mime == 'application/pdf':
                if header.startswith(b'%PDF-'):
                    return True, ""
                return False, "File is not a valid PDF"

            # JPEG magic bytes: FF D8 FF
            if expected_mime == 'image/jpeg':
                if header.startswith(b'\xFF\xD8\xFF'):
                    return True, ""
                return False, "File is not a valid JPEG"

            # PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
            if expected_mime == 'image/png':
                if header.startswith(b'\x89\x50\x4E\x47\x0D\x0A\x1A\x0A'):
                    return True, ""
                return False, "File is not a valid PNG"

            return False, "Unsupported MIME type"
    except Exception as e:
        return False, str(e)

def main():
    temp_files = []
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print_error("No input data provided via stdin.")
            sys.exit(1)

        data = json.loads(input_data)
        file_path = data.get('file_path')
        mime_type = data.get('mime_type')

        if not file_path:
            print(json.dumps({"error": "No file path provided"}))
            sys.exit(1)

        is_valid, error_msg = validate_magic_bytes(file_path, mime_type)
        if not is_valid:
            print(json.dumps({"error": f"Magic bytes validation failed: {error_msg}"}))
            sys.exit(1)

        # Redirect any internal print/logging from Paddle to stderr to keep stdout clean
        original_stdout = sys.stdout
        sys.stdout = sys.stderr

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

        # Restore stdout strictly for the JSON result
        sys.stdout = original_stdout
        print(json.dumps(output))
        sys.exit(0)

    except Exception as e:
        # If stdout was redirected, try restoring it to print the error JSON properly, or just print to stderr and exit non-zero
        try:
            sys.stdout = sys.__stdout__
            print(json.dumps({"error": str(e)}))
        except:
            sys.stderr.write(f"Fatal error: {str(e)}\n")
        sys.exit(1)
    finally:
        for f in temp_files:
            if os.path.exists(f):
                try:
                    os.remove(f)
                except:
                    pass

if __name__ == '__main__':
    main()
