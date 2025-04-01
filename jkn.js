// Image processing using HTML5 Canvas and JavaScript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

// Function to load and process image
async function processImage() {
    try {
        // Load the image
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Enable CORS for NASA image
        
        // Create a promise to handle image loading
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/mars/resources/detail_files/6944_Mars-Opportunity-blueberries-hematite-Fram-Crater-pia19113-full2.jpg?w=2560&format=webp&fit=clip&crop=faces%2Cfocalpoint';
        });

        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply histogram equalization
        const equalizedData = histogramEqualization(data);
        
        // Create new canvas for equalized image
        const equalizedCanvas = document.createElement('canvas');
        const equalizedCtx = equalizedCanvas.getContext('2d');
        equalizedCanvas.width = canvas.width;
        equalizedCanvas.height = canvas.height;
        document.body.appendChild(equalizedCanvas);

        // Put equalized data back to canvas
        const equalizedImageData = new ImageData(
            new Uint8ClampedArray(equalizedData),
            canvas.width,
            canvas.height
        );
        equalizedCtx.putImageData(equalizedImageData, 0, 0);

        // Apply unsharp masking
        const unsharpData = unsharpMask(data, canvas.width, canvas.height);
        
        // Create new canvas for unsharp masked image
        const unsharpCanvas = document.createElement('canvas');
        const unsharpCtx = unsharpCanvas.getContext('2d');
        unsharpCanvas.width = canvas.width;
        unsharpCanvas.height = canvas.height;
        document.body.appendChild(unsharpCanvas);

        // Put unsharp masked data back to canvas
        const unsharpImageData = new ImageData(
            new Uint8ClampedArray(unsharpData),
            canvas.width,
            canvas.height
        );
        unsharpCtx.putImageData(unsharpImageData, 0, 0);

    } catch (error) {
        console.error('Error processing image:', error);
    }
}

// Histogram equalization function
function histogramEqualization(data) {
    const histogram = new Array(256).fill(0);
    const cdf = new Array(256).fill(0);
    const result = new Uint8ClampedArray(data.length);

    // Calculate histogram
    for (let i = 0; i < data.length; i += 4) {
        histogram[data[i]]++;
        histogram[data[i + 1]]++;
        histogram[data[i + 2]]++;
    }

    // Calculate cumulative distribution function
    cdf[0] = histogram[0];
    for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + histogram[i];
    }

    // Normalize CDF
    const cdfMin = cdf[0];
    const cdfMax = cdf[255];
    const range = cdfMax - cdfMin;

    // Apply equalization
    for (let i = 0; i < data.length; i += 4) {
        result[i] = Math.round(((cdf[data[i]] - cdfMin) / range) * 255);
        result[i + 1] = Math.round(((cdf[data[i + 1]] - cdfMin) / range) * 255);
        result[i + 2] = Math.round(((cdf[data[i + 2]] - cdfMin) / range) * 255);
        result[i + 3] = data[i + 3];
    }

    return result;
}

// Unsharp masking function
function unsharpMask(data, width, height) {
    const result = new Uint8ClampedArray(data.length);
    const radius = 3;
    const amount = 2;

    // Create Gaussian kernel
    const kernel = createGaussianKernel(radius);

    // Apply convolution
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            for (let c = 0; c < 3; c++) {
                let sum = 0;
                let weightSum = 0;

                for (let ky = -radius; ky <= radius; ky++) {
                    for (let kx = -radius; kx <= radius; kx++) {
                        const px = x + kx;
                        const py = y + ky;

                        if (px >= 0 && px < width && py >= 0 && py < height) {
                            const idx = (py * width + px) * 4 + c;
                            const weight = kernel[ky + radius][kx + radius];
                            sum += data[idx] * weight;
                            weightSum += weight;
                        }
                    }
                }

                const idx = (y * width + x) * 4 + c;
                const original = data[idx];
                const blurred = sum / weightSum;
                result[idx] = Math.round(original + (original - blurred) * amount);
            }
            result[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3];
        }
    }

    return result;
}

// Helper function to create Gaussian kernel
function createGaussianKernel(radius) {
    const size = radius * 2 + 1;
    const kernel = Array(size).fill().map(() => Array(size).fill(0));
    const sigma = radius / 3;
    let sum = 0;

    for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
            const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
            kernel[y + radius][x + radius] = value;
            sum += value;
        }
    }

    // Normalize kernel
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            kernel[y][x] /= sum;
        }
    }

    return kernel;
}

// Start processing when the page loads
window.onload = processImage; 
