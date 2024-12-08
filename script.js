let firstTranslationLoading = true;

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

// determining the maxLength for the translation
let translationBox = document.querySelector('#translation-box');
let verseBox = document.querySelector('#verse');
let translationStyles = window.getComputedStyle(translationBox);

/* Get the x and y padding values for the translation box */
let xPadding = parseInt(translationStyles.paddingLeft) + parseInt(translationStyles.paddingRight);
let yPadding = parseInt(translationStyles.paddingTop) + parseInt(translationStyles.paddingBottom);

/* Get the x and y size values for the verse element */
let xVerse = parseInt(verseBox.offsetWidth);
let yVerse = parseInt(verseBox.offsetHeight);

/* Add the verse element x and y size to the translation box padding values */
let xNewPadding = xPadding + xVerse;
let yNewPadding = yPadding + yVerse;

let translationDiv = document.querySelector('#translation');
let translationFontSize = parseInt(window.getComputedStyle(translationDiv).getPropertyValue('font-size'));

let maxTranslationLength = ((WIDTH - xNewPadding) * (HEIGHT - yNewPadding)) / (translationFontSize * translationFontSize);

// freeing memory
translationBox = null; verseBox = null; translationStyles = null;
xPadding = null; yPadding = null;
xVerse = null; yVerse = null;
xNewPadding = null; yNewPadding = null;
translationDiv = null; translationFontSize = null;

const gitaApiKey = 'YOUR-API'; // Bhagavad Gita API key (https://rapidapi.com/bhagavad-gita-bhagavad-gita-default/api/bhagavad-gita3/)
const pixabayKey = 'YOUR-API'; // Pixabay API key

let imageQueue = [];  // Array to store pre-fetched images
let pageHistory = []; // Array to track fetched pages
let currentImageIndex = 0;

function hideLoader() {
    document.querySelector('.ring').remove(); // Remove the loading screen
    document.querySelector('#background-image').style.display = 'block'; // Display the background image
}

async function getVerse() {
    return new Promise((resolve) => {
        document.getElementById('translation-box').style.opacity = 0; // Verse has faded
        document.getElementById("sound-toggle-button").style.display = "block"; // Display sound toggle button when verse has faded
        setTimeout(() => {
            resolve();
        }, 1000); // Fade out transition duration is 1 second
    })
        .then(async () => {
            const chapter = Math.floor(Math.random() * 17) + 2; // Random chapter between 2 and 18

            const chapterResponse = await fetch(`https://bhagavad-gita3.p.rapidapi.com/v2/chapters/${chapter}/`, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': gitaApiKey,
                    'x-rapidapi-host': 'bhagavad-gita3.p.rapidapi.com',
                },
            });

            const chapterData = await chapterResponse.json();
            const versesCount = chapterData.verses_count; // Get the verses count for the selected chapter

            // For chapters beyond chapter 1, select a verse starting from 11
            let verse;
            if (chapter === 2) {
                // For chapter 2, select a verse starting from 11 to the total verses in chapter 2
                verse = Math.floor(Math.random() * (versesCount - 10)) + 11;
            } else {
                // For other chapters, select any verse within the range
                verse = Math.floor(Math.random() * versesCount) + 1;
            }

            const verseResponse = await fetch(`https://bhagavad-gita3.p.rapidapi.com/v2/chapters/${chapter}/verses/${verse}/`, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': gitaApiKey,
                    'x-rapidapi-host': 'bhagavad-gita3.p.rapidapi.com',
                },
            });

            const verseData = await verseResponse.json();

            document.getElementById('translation').innerHTML = `${verseData.translations[0].description}`; // Translation in translation (no translations)
            document.getElementById('verse').innerHTML = `${verseData.text}`; // Sanskrit text in verse (no translations)
            return displayNextImage(); // Display the next image from pre-fetched images
        });
}

function displayNextImage() {
    if (imageQueue.length === 0) {
        fetchImages(); // If no images are left, fetch a new set
    } else {
        // Display the next image from the queue, but first ensure it's fully loaded before showing the translation
        const img = new Image();
        img.onload = () => {
            document.getElementById('background-image').src = img.src; // Set the image once it's loaded
            if (firstTranslationLoading) {
                hideLoader(); // Ensure loader is hidden only after the first image is loaded
                firstTranslationLoading = false;
            }
            showTranslation(); // Now show the translation and verse after the image is loaded
        };
        img.src = imageQueue[currentImageIndex];
        currentImageIndex++;
        if (currentImageIndex >= imageQueue.length) {
            currentImageIndex = 0; // Reset the index to start from the beginning
        }
    }
}

function showTranslation() {
    document.getElementById('translation-box').style.opacity = 1; // Box with new content and fade it back in
    document.getElementById("sound-toggle-button").style.display = "none"; // Hide sound toggle button when a new verse loads
}

async function fetchImages() {
    let randomPage;
    do {
        randomPage = Math.floor(Math.random() * 51) + 1; // Random page between 1 and 51
    } while (pageHistory.includes(randomPage)); // Ensure the page hasn't been fetched

    pageHistory.push(randomPage);

    // Fetch images for the random page
    const pixabayUrl = `https://pixabay.com/api/?key=${pixabayKey}&category=nature&orientation=horizontal&image_type=photo&page=${randomPage}&per_page=10`;

    try {
        const response = await fetch(pixabayUrl);
        const data = await response.json();
        const images = data.hits.map(hit => hit.largeImageURL);

        // Shuffle the images array to randomize the display order
        for (let i = images.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [images[i], images[j]] = [images[j], images[i]]; // Swap elements
        }

        imageQueue = images;
        currentImageIndex = 0;
    } catch (error) {
        console.error('Error fetching images:', error);
    }
}

function updateTranslation() {
    getVerse().then(() => {
        const verseLength = document.getElementById('translation').innerHTML.length;
        const interval = Math.max(verseLength * 100, 5000) + 5000; // Minimum interval of 10 seconds, with an extra delay based on verse length

        setTimeout(updateTranslation, interval);
    });
}

fetchImages();
updateTranslation();
