import asyncio
import os
from playwright.async_api import async_playwright

async def download_exams():
    base_dir = os.path.expanduser("~/Downloads/cs61c-exams")
    pdf_dir = os.path.join(base_dir, "exam-pdfs")
    url_file = os.path.join(base_dir, "exam-urls.txt")
    
    if not os.path.exists(pdf_dir):
        os.makedirs(pdf_dir)
        
    if not os.path.exists(url_file):
        print(f"Error: {url_file} not found.")
        return

    with open(url_file, "r") as f:
        urls = [line.strip() for line in f if line.strip()]

    print(f"Found {len(urls)} URLs to process.")

    async with async_playwright() as p:
        # Launch visible browser so you can do 2FA
        user_data_dir = os.path.expanduser("~/.playwright_cs61c_profile")
        browser = await p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,
            args=["--no-sandbox"]
        )
        
        page = browser.pages[0] if browser.pages else await browser.new_page()

        print("\n=======================================================")
        print("Opening the first URL to trigger CalNet Login.")
        print("Please log in using your credentials and complete Duo 2FA.")
        print("=======================================================\n")
        
        await page.goto(urls[0])
        
        # Wait for user to get past login (CalNet URLs contain 'cas/login' or 'auth')
        while "login" in page.url.lower() or "auth" in page.url.lower() or "duo" in page.url.lower():
            await asyncio.sleep(2)
            
        print("Login complete! Starting downloads...")

        for url in urls:
            filename = url.split("/")[-1]
            filepath = os.path.join(pdf_dir, filename)
            
            if os.path.exists(filepath):
                print(f"Skipping {filename} (already exists)")
                continue

            print(f"Downloading {filename}...")
            try:
                # We fetch the PDF directly using the authenticated page context
                response = await page.request.get(url)
                if response.ok:
                    pdf_data = await response.body()
                    with open(filepath, "wb") as pdf_file:
                        pdf_file.write(pdf_data)
                else:
                    print(f"Failed to fetch {filename}: Status {response.status}")
            except Exception as e:
                print(f"Error downloading {filename}: {e}")

        await browser.close()
        print("\nAll downloads complete. Check the exam-pdfs folder!")

if __name__ == "__main__":
    asyncio.run(download_exams())
