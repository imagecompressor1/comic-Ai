let selectedStyle =
    "modern comic book, vibrant colors";

let generatedPanels = [];


/* ================================
   STYLE
================================ */

document
    .querySelectorAll(".style")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".style")
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );


                selectedStyle =
                    button.dataset.style;

            }
        );

    });


/* ================================
   IMAGE SIZE
================================ */

function getSize() {

    const ratio =
        document
            .getElementById("ratio")
            .value;


    if (ratio === "portrait") {

        return {
            width: 768,
            height: 960
        };

    }


    if (ratio === "landscape") {

        return {
            width: 1024,
            height: 576
        };

    }


    return {
        width: 768,
        height: 768
    };

}


/* ================================
   CREATE PANEL PROMPTS
================================ */

function createPrompts(
    story,
    count
) {

    const scenes = [

        "Establishing scene. Introduce the main character and environment.",

        "Character discovery scene. Show emotion and reaction.",

        "Important action scene. Dynamic cinematic composition.",

        "Conflict scene. Create tension and movement.",

        "Climax scene. Strong emotional moment.",

        "Resolution scene. Characters solve the problem.",

        "Quiet emotional scene.",

        "Final memorable ending scene."

    ];


    const prompts = [];


    for (
        let i = 0;
        i < count;
        i++
    ) {

        prompts.push(`

${scenes[i]}

Story:

${story}

Art style:

${selectedStyle}

Comic panel ${i + 1} of ${count}.

Keep the same characters throughout
the entire comic.

Character consistency:

same face,
same hair,
same clothing,
same colors,
same body proportions.

Professional comic illustration.

Cinematic composition.

Detailed environment.

Expressive characters.

No speech bubbles.

No text.

No watermark.

No logo.

        `);

    }


    return prompts;

}


/* ================================
   GENERATE IMAGE
================================ */

async function generateImage(
    prompt
) {

    const size =
        getSize();


    const response =
        await fetch(
            "/api/generate",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    prompt,

                    width:
                        size.width,

                    height:
                        size.height

                })

            }
        );


    const data =
        await response.json();


    if (
        !response.ok ||
        !data.success
    ) {

        throw new Error(
            data.error ||
            "Image generation failed"
        );

    }


    return data.image;

}


/* ================================
   GENERATE COMIC
================================ */

async function generateComic() {

    const story =
        document
            .getElementById("story")
            .value
            .trim();


    const count =
        Number(
            document
                .getElementById(
                    "panelCount"
                )
                .value
        );


    if (!story) {

        alert(
            "لطفاً داستان را وارد کنید."
        );

        return;

    }


    const button =
        document.getElementById(
            "generate"
        );


    const progress =
        document.getElementById(
            "progress"
        );


    const progressText =
        document.getElementById(
            "progressText"
        );


    const progressFill =
        document.getElementById(
            "progressFill"
        );


    const comic =
        document.getElementById(
            "comic"
        );


    button.disabled = true;

    button.textContent =
        "⏳ در حال ساخت...";


    progress.classList.remove(
        "hidden"
    );


    comic.innerHTML = "";

    generatedPanels = [];


    const prompts =
        createPrompts(
            story,
            count
        );


    for (
        let i = 0;
        i < prompts.length;
        i++
    ) {

        progressText.textContent =
            `در حال ساخت پنل ${i + 1} از ${count}...`;


        progressFill.style.width =
            `${(i / count) * 100}%`;


        const panel =
            document.createElement(
                "div"
            );


        panel.className =
            "comicPanel";


        panel.innerHTML = `

            <div
                style="
                padding:60px 20px;
                text-align:center;
                color:#7d86a2;
                "
            >

                🎨

                <br><br>

                در حال تولید تصویر...

            </div>

        `;


        comic.appendChild(panel);


        try {

            const image =
                await generateImage(
                    prompts[i]
                );


            generatedPanels.push({

                image: image,

                prompt:
                    prompts[i],

                number:
                    i + 1

            });


            panel.innerHTML = `

                <img
                    src="${image}"
                    alt="Comic panel ${i + 1}"
                >

                <div
                    class="panelInfo"
                >

                    <div
                        class="panelTitle"
                    >
                        پنل ${i + 1}
                    </div>

                    <div
                        class="panelStatus"
                    >
                        ✅ تولید شد
                    </div>

                    <div
                        class="panelButtons"
                    >

                        <button
                            onclick="
                            downloadImage(
                                '${image}',
                                ${i + 1}
                            )
                            "
                        >
                            📥 ذخیره
                        </button>


                        <button
                            onclick="
                            regeneratePanel(
                                ${i}
                            )
                            "
                        >
                            🔄 دوباره
                        </button>

                    </div>

                </div>

            `;


        } catch (error) {

            console.error(error);


            generatedPanels.push({

                image: null,

                prompt:
                    prompts[i],

                number:
                    i + 1

            });


            panel.innerHTML = `

                <div
                    class="errorPanel"
                >

                    ❌

                    <br><br>

                    تولید تصویر ناموفق بود.

                    <br><br>

                    <small>
                    ${escapeHtml(
                        error.message
                    )}
                    </small>

                    <br><br>

                    <button
                        onclick="
                        regeneratePanel(
                            ${i}
                        )
                        "
                    >
                        🔄 تلاش مجدد
                    </button>

                </div>

            `;

        }

    }


    progressFill.style.width =
        "100%";


    progressText.textContent =
        "✅ ساخت کمیک تمام شد";


    button.disabled = false;

    button.textContent =
        "🚀 ساخت کمیک";

}


/* ================================
   REGENERATE
================================ */

async function regeneratePanel(
    index
) {

    const panelData =
        generatedPanels[index];


    if (!panelData) {

        return;

    }


    try {

        const image =
            await generateImage(
                panelData.prompt
            );


        panelData.image =
            image;


        const panels =
            document.querySelectorAll(
                ".comicPanel"
            );


        const panel =
            panels[index];


        panel.innerHTML = `

            <img
                src="${image}"
                alt="Comic panel ${index + 1}"
            >

            <div class="panelInfo">

                <div class="panelTitle">
                    پنل ${index + 1}
                </div>

                <div class="panelStatus">
                    ✅ دوباره تولید شد
                </div>

                <div class="panelButtons">

                    <button
                        onclick="
                        downloadImage(
                            '${image}',
                            ${index + 1}
                        )
                        "
                    >
                        📥 ذخیره
                    </button>

                    <button
                        onclick="
                        regeneratePanel(
                            ${index}
                        )
                        "
                    >
                        🔄 دوباره
                    </button>

                </div>

            </div>

        `;


    } catch (error) {

        alert(
            "خطا: " +
            error.message
        );

    }

}


/* ================================
   DOWNLOAD
================================ */

function downloadImage(
    image,
    number
) {

    if (!image) {

        alert(
            "این پنل تصویر ندارد."
        );

        return;

    }


    const a =
        document.createElement(
            "a"
        );


    a.href = image;

    a.download =
        `comic-panel-${number}.png`;


    document.body.appendChild(a);

    a.click();

    a.remove();

}


/* ================================
   DOWNLOAD ALL
================================ */

document
    .getElementById(
        "downloadAll"
    )
    .addEventListener(
        "click",
        async () => {

            for (
                let i = 0;
                i < generatedPanels.length;
                i++
            ) {

                if (
                    generatedPanels[i].image
                ) {

                    downloadImage(
                        generatedPanels[i].image,
                        i + 1
                    );

                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                500
                            )
                    );

                }

            }

        }
    );


/* ================================
   START
================================ */

document
    .getElementById(
        "generate"
    )
    .addEventListener(
        "click",
        generateComic
    );


/* ================================
   ESCAPE
================================ */

function escapeHtml(text) {

    return String(text)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}
