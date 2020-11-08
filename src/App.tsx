import React, { useState, useRef } from 'react';
import './App.css';
import { usePdf } from '@mikecousins/react-pdf';
import { jsPDF } from 'jspdf';

async function invertImage(imageURL: string) {
  return new Promise((resolve, reject) => {
    console.log("Began saving inverted...");
    let img = new Image();
    img.crossOrigin = "";
    console.log("Drawing func...");
    img.onload = draw;
    img.src = imageURL;
    console.log("Before Draw...", imageURL);

    function draw() {
      console.log("Began draw");
      let canvas = document.querySelector("#dark-canvas");
      // @ts-ignore
      let ctx = canvas.getContext("2d");
      // @ts-ignore
      ctx.filter = "invert(1)";
      // @ts-ignore
      canvas.width = img.width;
      // @ts-ignore
      canvas.height = img.height;

      // filter
      // @ts-ignore
      if (typeof ctx.filter !== "undefined") {
        // @ts-ignore
        ctx.filter = "invert(1)";
        // @ts-ignore
        ctx.drawImage(img, 0, 0);
        console.log("Hit if");
      } else {
        console.log("Hit else");
        // @ts-ignore
        ctx.drawImage(img, 0, 0);
        // @ts-ignore
        ctx.filter = "invert(1)";
        console.log("Made it here");
      }

      // @ts-ignore
      resolve(canvas.toDataURL());
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

    // Because this page's rotation option overwrites pdf default rotation value,
    // calculating page rotation option value from pdf default and this component prop rotate.
    const rotation = rotate === 0 ? page.rotate : page.rotate + rotate;
    const dpRatio = window.devicePixelRatio;
    const adjustedScale = scale * dpRatio;
    const viewport = page.getViewport({ scale: adjustedScale, rotation });

    const canvasContext = canvasEl.getContext('2d');
    // if (!canvasContext) {
    //   continue;
    // }

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


    document.body.appendChild(darkImage);
    // @ts-ignore
    imageArray.push(invertedURL);
  }

  return imageArray;
}

function imagesToPDF(imageArray: Array<string>) {
  let doc = new jsPDF('p', 'mm'); // TODO CHANGE ORIENTATION BASED ON IMAGE SIZES
  console.log("The page SIZES ARE!!!!!!!!!" + doc.internal.pageSize.getHeight() + "AND" + doc.internal.pageSize.getWidth());

  for (let i = 0; i < imageArray.length; i++) {
    doc.addPage();
    doc.setPage(i+1);
    const imgData = imageArray[i];

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    doc.setFillColor('#000000');
    doc.rect(0, 0, width, height);
    // @ts-ignore
    doc.addImage(imgData, 0, 0, width, height);
  }
  doc.save("FinalVersion!.pdf");
}

function App() {
  const [page, setPage] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState('');

  const { pdfDocument, pdfPage } = usePdf({
    file: 'http://localhost:3000/A2_handout.pdf',
    page,
    canvasRef,
  });


  async function getPDFURL() {
    const originalDataURL = await canvasRef.current!.toDataURL();
    return originalDataURL;
  }

  function addInvertedImagetoArray(dataBlob: string) {

  }


  // --------- Below this point is trials ---------
  function invertImage(dataURL: string) {
    return dataURL;
  }

  function saveInverted(imageURL: string) {
    console.log("Began saving inverted...");
    let img = new Image();
    img.crossOrigin = "";
    console.log("Drawing func...");
    img.onload = draw;
    img.src = imageURL;
    console.log("Before Draw...", imageURL);

    function draw() {
      console.log("Began draw");
      let canvas = document.querySelector("#dark-canvas");
      // @ts-ignore
      let ctx = canvas.getContext("2d");
      // @ts-ignore
      ctx.filter = "invert(1)";
      ctx.filter = "contrast(1.25)";
      // @ts-ignore
      canvas.width = img.width;
      // @ts-ignore
      canvas.height = img.height;

      // filter
      // @ts-ignore
      if (typeof ctx.filter !== "undefined") {
        // @ts-ignore
        ctx.filter = "invert(1)";
        // @ts-ignore
        ctx.drawImage(img, 0, 0);
        console.log("Hit if");
      }
      else {
        console.log("Hit else");
        // @ts-ignore
        ctx.drawImage(img, 0, 0);
        // @ts-ignore
        ctx.filter = "invert(1)";
        console.log("Made it here");
      }

      // @ts-ignore
      // document.querySelector("img").src = canvas.toDataURL();

      // @ts-ignore
      // let image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.
      // window.location.href=image; // it will save locally
    }
  }

  return (
      <div>
        {!pdfDocument && <span>Loading...</span>}
        {pdfDocument && pdfDocument.numPages && <nav>
              <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <button
                  disabled={page === pdfDocument.numPages}
                  onClick={() => setPage(page + 1)}
              >
                Next
              </button>
              <button onClick={async () => {
                const imageArray = await invertPdfPages(pdfDocument);
                imagesToPDF(imageArray);
                // let imageArray = [];
                // const darkCanvas = document.querySelector("#dark-canvas");
                // getPDFURL().then(setDataUrl);
                //
                // for (let i = 1; i <= pdfDocument.numPages; i++) {
                //   setPage(i);
                //   getPDFURL().then(saveInverted);
                //   // @ts-ignore
                //   let image = darkCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.
                //
                //   // @ts-ignore
                //   imageArray.push(image);
                // }
                // console.log("printing elements");
                // console.log(imageArray);
              }}>
                Get image
              </button>

            </nav>}
        <div>
          <h1>Mike's canvas</h1>
          <canvas ref={canvasRef} />
        </div>
        <div>
          <h1>Parssa's canvas</h1>
          <canvas id="dark-canvas" />
        </div>
        <h1>Debug img</h1>
        {
          dataUrl && (
            <img src={dataUrl}/>)
        }
      </div>
  );
}

export default App;
