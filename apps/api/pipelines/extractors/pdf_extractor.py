import fitz  # PyMuPDF
import uuid
import os
from typing import Tuple, List, Dict, Any

def extract_pdf_content(pdf_path: str, output_image_dir: str) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Extracts text and image blocks from a PDF.
    Saves extracted images to output_image_dir as {uuid}.png.
    Inserts [IMAGE_REF:uuid] in the returned text.
    
    Args:
        pdf_path: Path to the PDF file.
        output_image_dir: Directory where images should be saved.
        
    Returns:
        Tuple[str, List[Dict[str, Any]]]: A tuple containing:
            - The full text of the PDF with [IMAGE_REF:uuid] placeholders.
            - A list of dicts with keys "uuid" and "file_path" for each extracted image.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found at: {pdf_path}")
        
    doc = fitz.open(pdf_path)
    full_text_parts = []
    extracted_images = []

    os.makedirs(output_image_dir, exist_ok=True)

    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Get text from page
        page_text = page.get_text("text")
        
        # Extract images
        image_list = page.get_images(full=True)
        page_placeholders = []
        
        for img_info in image_list:
            try:
                xref = img_info[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image.get("ext", "png")
                
                # Generate unique ID for this image
                img_uuid = str(uuid.uuid4())
                img_filename = f"{img_uuid}.{image_ext}"
                img_path = os.path.join(output_image_dir, img_filename)
                
                # Write to disk
                with open(img_path, "wb") as f:
                    f.write(image_bytes)
                    
                extracted_images.append({
                    "uuid": img_uuid,
                    "file_path": img_path
                })
                
                # Save placeholder to insert
                page_placeholders.append(f"\n[IMAGE_REF:{img_uuid}]\n")
            except Exception as e:
                # Log or handle image extraction failure gracefully
                print(f"Error extracting image at page {page_num}: {e}")
                
        # Append page text and placeholders
        full_text_parts.append(page_text)
        if page_placeholders:
            full_text_parts.extend(page_placeholders)
            
    doc.close()
    return "\n".join(full_text_parts), extracted_images
