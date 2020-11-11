import React, { useState, useRef } from 'react';
import './App.css';
import { usePdf } from '@mikecousins/react-pdf';
import { jsPDF } from 'jspdf';


async function invertImage(imageURL: string) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.crossOrigin = "";
    img.onload = draw;
    img.src = imageURL;

    function draw() {
      let canvas = document.querySelector("#dark-canvas");
      // @ts-ignore
      let ctx = canvas.getContext("2d");
      // @ts-ignore
      ctx.filter = "invert(1) hue-rotate(90grad)";
      // @ts-ignore
      canvas.width = img.width;
      // @ts-ignore
      canvas.height = img.height;

      // filter
      // @ts-ignore
      if (typeof ctx.filter !== "undefined") {
        // @ts-ignore
        ctx.filter = "invert(1) hue-rotate(180grad) contrast(160%)";
        // ctx.imageRendering = "pixelated";
        // @ts-ignore
        ctx.drawImage(img, 0, 0);
      } else {
        // @ts-ignore
        ctx.drawImage(img, 0, 0);
        // @ts-ignore
        ctx.filter = "invert(1) hue-rotate(180grad) contrast(160%)";
      }
      // @ts-ignore
      resolve(canvas.toDataURL(0.8));
    }
  })
}


async function invertPdfPages(pdfDocument): Promise<Array<string>> {
  let imageArray = [];
  const rotate = 0;
  const scale = 1;

  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const canvasEl = document.createElement('canvas');
    const page = await pdfDocument.getPage(i);

    const rotation = rotate === 0 ? page.rotate : page.rotate + rotate;
    console.log("rotation is " +rotation);
    const dpRatio = window.devicePixelRatio;
    const adjustedScale = scale * dpRatio;
    const viewport = page.getViewport({ scale: adjustedScale, rotation });

    const canvasContext = canvasEl.getContext('2d');

    canvasEl.style.width = `${viewport.width / dpRatio}px`;
    canvasEl.style.height = `${viewport.height / dpRatio}px`;
    canvasEl.height = viewport.height;
    canvasEl.width = viewport.width;

    await page.render({
      canvasContext,
      viewport,
    }).promise;


    let dataURL = canvasEl.toDataURL();
    let invertedURL = await invertImage(dataURL);

    console.log("page" + i + "this inverted URL is" + invertedURL);
    const darkImage = document.createElement("img");
    // @ts-ignore
    darkImage.src = invertedURL;

    // @ts-ignore
    imageArray.push(invertedURL);
  }

  return imageArray;
}

function imagesToPDF(imageArray: Array<string>, orientation: String) {
  // @ts-ignore
  let doc = new jsPDF(orientation, 'mm');

  for (let i = 0; i < imageArray.length; i++) {
    if (i !== imageArray.length - 1) doc.addPage();

    doc.setPage(i+1);
    const imgData = imageArray[i];

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    doc.setFillColor('#000000');
    doc.rect(0, 0, width, height);
    // @ts-ignore
    doc.addImage(imgData, 0, 0, width, height);
  }
  doc.save("DarkVersion.pdf");
}

// file: 'http://localhost:3000/A2_handout.pdf',

function getDataUrlFromFile(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.addEventListener('load', function () {
      resolve(reader.result);
    }, false);
    reader.readAsDataURL(file);
  });
}

function PdfPreview(props) {
  const [page, setPage] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState('');

  let { pdfDocument, pdfPage } = usePdf({
    file: props.dataUrl,
    page,
    canvasRef,
  });

  return (
      <div>
        {!pdfDocument &&<span>Loading...</span>}
        {
          pdfDocument && pdfDocument.numPages && <nav>

            <button onClick={async () => {
              const imageArray = await invertPdfPages(pdfDocument);
              imagesToPDF(imageArray, 'p');
            }}>
              INVERT PORTRAIT
            </button>

            <button onClick={async () => {
              const imageArray = await invertPdfPages(pdfDocument);
              imagesToPDF(imageArray, 'l');
            }}>
              INVERT LANDSCAPE
            </button>
          </nav>
        }
        <div>
          <canvas ref={canvasRef} />
        </div>
        <div>
          <canvas id="dark-canvas" />
        </div>
      </div>
  );
}

function App() {
  const [dataUrl, setDataUrl] = useState(null);
  return (
      <div>
        <input type="file"
               onChange={async (evt) => {
                 const files = evt.target.files;

                 // @ts-ignore
                 if (files.length) {
                   // Picked a file.
                   // @ts-ignore
                   const newDataUrl = await getDataUrlFromFile(files[0]);
                   // @ts-ignore
                   setDataUrl(newDataUrl);
                 }
               }}
               accept="application/pdf"
        />
        {dataUrl ? <PdfPreview dataUrl={dataUrl}/> : null}
      </div>
  );
}

export default App;
