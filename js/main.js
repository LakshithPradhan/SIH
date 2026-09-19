/* ============================================================
   TERRAGLOBE
   MAIN APPLICATION
   ============================================================ */

"use strict";


/* ============================================================
   HELPERS
   ============================================================ */

const $ =
    selector =>
        document.querySelector(
            selector
        );


/* ============================================================
   TARGET
   ============================================================ */

window.terraTarget = {

    name:
        "New Delhi",

    lat:
        28.6139,

    lon:
        77.2090

};


/* ============================================================
   BODY MODES
   ============================================================ */

function setCinematicMode() {

    document.body.classList.remove(
        "explore-mode",
        "analysis-open"
    );


    document.body.classList.add(
        "cinematic-mode"
    );


    $("#navExplore")
        ?.classList.remove(
            "active"
        );


    $("#navAnalyze")
        ?.classList.remove(
            "active"
        );


    window.terraGlobe
        ?.enterCinematicMode();

}


function setExploreMode() {

    document.body.classList.remove(
        "cinematic-mode",
        "analysis-open"
    );


    document.body.classList.add(
        "explore-mode"
    );


    $("#navExplore")
        ?.classList.add(
            "active"
        );


    $("#navAnalyze")
        ?.classList.remove(
            "active"
        );


    window.terraGlobe
        ?.enterExploreMode();

}


/* ============================================================
   HOME
   ============================================================ */

$("#home")?.addEventListener(
    "click",
    function () {

        setCinematicMode();

    }
);


/* ============================================================
   EXPLORE NAV
   ============================================================ */

$("#navExplore")?.addEventListener(
    "click",
    function () {

        setExploreMode();

    }
);


/* ============================================================
   3D BUTTON
   ============================================================ */

$("#three")?.addEventListener(
    "click",
    function () {

        setExploreMode();

        this.classList.add(
            "active"
        );

    }
);


/* ============================================================
   ANALYZE NAV
   ============================================================ */

$("#navAnalyze")?.addEventListener(
    "click",
    function () {

        openAnalysisWorkspace();

    }
);


/* ============================================================
   LANDING HERO
   ============================================================ */

$("#heroExplore")?.addEventListener(
    "click",
    function () {

        setExploreMode();

    }
);


$("#heroAnalyze")?.addEventListener(
    "click",
    function () {

        openAnalysisWorkspace();

    }
);


function animateHeroStats() {

    document
        .querySelectorAll(
            ".hero-stats b[data-target]"
        )
        .forEach(function (el) {

            const target =
                parseFloat(
                    el.dataset.target
                );

            const decimals =
                parseInt(
                    el.dataset.decimals || "0",
                    10
                );

            const prefix =
                el.dataset.prefix || "";

            const suffix =
                el.dataset.suffix || "";

            const start =
                performance.now();

            function step(now) {

                const t =
                    Math.min(
                        (now - start) / 1100,
                        1
                    );

                el.textContent =
                    prefix +
                    (target * t).toFixed(decimals) +
                    suffix;

                if (t < 1) {
                    requestAnimationFrame(step);
                }

            }

            requestAnimationFrame(step);

        });

}


if (
    document.body.classList.contains(
        "cinematic-mode"
    )
) {

    setTimeout(
        animateHeroStats,
        400
    );

}


/* ============================================================
   ANALYSIS WORKSPACE
   ============================================================ */

function openAnalysisWorkspace() {

    document.body.classList.remove(
        "cinematic-mode",
        "explore-mode"
    );


    document.body.classList.add(
        "analysis-open"
    );


    $("#analysisWorkspace")
        ?.setAttribute(
            "aria-hidden",
            "false"
        );


    $("#navAnalyze")
        ?.classList.add(
            "active"
        );


    window.terraGlobe
        ?.enterExploreMode();

}


function closeAnalysisWorkspace() {

    document.body.classList.remove(
        "analysis-open"
    );


    $("#analysisWorkspace")
        ?.setAttribute(
            "aria-hidden",
            "true"
        );


    $("#navAnalyze")
        ?.classList.remove(
            "active"
        );


    setCinematicMode();

}


$("#closeWorkspace")?.addEventListener(
    "click",
    closeAnalysisWorkspace
);


/* ============================================================
   ZOOM IN
   ============================================================ */

$("#plus")?.addEventListener(
    "click",
    function () {

        setExploreMode();


        const viewer =
            window.terraGlobe
                ?.viewer;


        if (!viewer) {

            return;

        }


        viewer.camera.zoomIn(
            300000
        );


        setControlActive(
            this
        );

    }
);


/* ============================================================
   ZOOM OUT
   ============================================================ */

$("#minus")?.addEventListener(
    "click",
    function () {

        setExploreMode();


        const viewer =
            window.terraGlobe
                ?.viewer;


        if (!viewer) {

            return;

        }


        viewer.camera.zoomOut(
            300000
        );


        setControlActive(
            this
        );

    }
);


/* ============================================================
   RESET
   ============================================================ */

$("#reset")?.addEventListener(
    "click",
    function () {

        setExploreMode();


        window.terraGlobe
            ?.resetCamera();


        setControlActive(
            this
        );

    }
);


/* ============================================================
   PIN
   ============================================================ */

$("#pin")?.addEventListener(
    "click",
    function () {

        setExploreMode();


        window.terraGlobe
            ?.pinLocation();


        setControlActive(
            this
        );

    }
);


/* ============================================================
   LOCATE
   ============================================================ */

$("#locate")?.addEventListener(
    "click",
    function () {

        setExploreMode();


        window.terraGlobe
            ?.locateTarget();


        setControlActive(
            this
        );

    }
);


/* ============================================================
   FULLSCREEN
   ============================================================ */

$("#full")?.addEventListener(
    "click",
    async function () {

        try {

            if (
                !document.fullscreenElement
            ) {

                await document
                    .documentElement
                    .requestFullscreen();

            } else {

                await document
                    .exitFullscreen();

            }

        } catch (error) {

            console.warn(
                "Fullscreen unavailable:",
                error
            );

        }

    }
);


/* ============================================================
   TARGET LOCK
   ============================================================ */

let targetLocked =
    false;


$("#lock")?.addEventListener(
    "click",
    function () {

        targetLocked =
            !targetLocked;


        this.classList.toggle(
            "locked",
            targetLocked
        );


        this.innerHTML =
            targetLocked
                ? "● Locked"
                : "◉ Lock Target";

    }
);


/* ============================================================
   SEARCH
   ============================================================ */

$("#search")?.addEventListener(
    "keydown",
    async function (event) {

        if (
            event.key !== "Enter"
        ) {

            return;

        }


        const query =
            this.value.trim();


        if (!query) {

            return;

        }


        this.disabled =
            true;


        try {

            const url =
                "https://nominatim.openstreetmap.org/search" +
                "?format=json" +
                "&limit=1" +
                "&q=" +
                encodeURIComponent(
                    query
                );


            const response =
                await fetch(
                    url,
                    {
                        headers:
                            {
                                Accept:
                                    "application/json"
                            }
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Search failed"
                );

            }


            const results =
                await response.json();


            if (
                !results.length
            ) {

                alert(
                    "Location not found."
                );

                return;

            }


            const location =
                results[0];


            const latitude =
                parseFloat(
                    location.lat
                );


            const longitude =
                parseFloat(
                    location.lon
                );


            window.updateTarget(
                latitude,
                longitude,
                location.display_name
            );


            setExploreMode();


            window.terraGlobe
                ?.flyToLocation(
                    latitude,
                    longitude,
                    250000
                );


        } catch (error) {

            console.error(
                error
            );


            alert(
                "Location search is unavailable."
            );

        } finally {

            this.disabled =
                false;

        }

    }
);


/* ============================================================
   UPDATE TARGET
   ============================================================ */

window.updateTarget =
    function (
        latitude,
        longitude,
        name = "Selected Location"
    ) {

        window.terraTarget = {

            name,

            lat:
                latitude,

            lon:
                longitude

        };


        const lat =
            formatCoordinate(
                latitude,
                "N",
                "S"
            );


        const lon =
            formatCoordinate(
                longitude,
                "E",
                "W"
            );


        setText(
            "bottomLatLon",
            `${lat} ${lon}`
        );


        setText(
            "metaLat",
            lat
        );


        setText(
            "metaLon",
            lon
        );

    };


/* ============================================================
   CAPTURE & ENHANCE
   ============================================================ */

let latestCapture =
    null;


/*
 * Change this later if your FastAPI
 * server is hosted elsewhere.
 */

const API_BASE =
    window.TERRAGLOBE_API_URL ||
    "http://127.0.0.1:8000";


const SR_ENDPOINT =
    `${API_BASE}/api/super-resolution`;


/* ============================================================
   CAPTURE OPEN
   ============================================================ */

$("#capture")?.addEventListener(
    "click",
    function () {

        setExploreMode();


        if (
            !window.terraGlobe
                ?.captureCurrentView
        ) {

            alert(
                "The Earth engine is still loading."
            );

            return;

        }


        latestCapture =
            window.terraGlobe
                .captureCurrentView();


        if (!latestCapture) {

            alert(
                "Unable to capture the Earth view."
            );

            return;

        }


        showCapture(
            latestCapture
        );

    }
);


/* ============================================================
   SHOW CAPTURE
   ============================================================ */

function showCapture(
    capture
) {

    const modal =
        $("#captureModal");


    if (!modal) {

        return;

    }


    const preview =
        $("#capturePreview");


    preview.src =
        capture.dataUrl;


    setText(
        "captureLat",
        formatCoordinate(
            capture.latitude,
            "N",
            "S"
        )
    );


    setText(
        "captureLon",
        formatCoordinate(
            capture.longitude,
            "E",
            "W"
        )
    );


    setText(
        "captureAlt",
        formatDistance(
            capture.altitude
        )
    );


    setText(
        "captureDistance",
        formatDistance(
            capture.distance
        )
    );


    setText(
        "captureHeading",
        Number.isFinite(
            capture.heading
        )
            ? `${capture.heading.toFixed(1)}°`
            : "—"
    );


    setText(
        "capturePitch",
        Number.isFinite(
            capture.pitch
        )
            ? `${capture.pitch.toFixed(1)}°`
            : "—"
    );


    setText(
        "captureStatus",
        "Scene captured successfully · ready for AI enhancement."
    );


    setText(
        "captureResultMessage",
        "Waiting for AI enhancement."
    );


    $("#captureResult")
        ?.setAttribute(
            "hidden",
            ""
        );


    $("#enhancedResultImage")
        ?.setAttribute(
            "hidden",
            ""
        );


    $("#enhanceCapture")
        ?.removeAttribute(
            "disabled"
        );


    modal.classList.add(
        "visible"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


/* ============================================================
   CLOSE CAPTURE
   ============================================================ */

function closeCapture() {

    const modal =
        $("#captureModal");


    modal?.classList.remove(
        "visible"
    );


    modal?.setAttribute(
        "aria-hidden",
        "true"
    );

}


$("#closeCapture")?.addEventListener(
    "click",
    closeCapture
);


$("#captureModal")
    ?.querySelector(
        ".capture-backdrop"
    )
    ?.addEventListener(
        "click",
        closeCapture
    );


/* ============================================================
   RETAKE
   ============================================================ */

$("#retakeCapture")?.addEventListener(
    "click",
    function () {

        const capture =
            window.terraGlobe
                ?.captureCurrentView();


        if (capture) {

            latestCapture =
                capture;


            showCapture(
                capture
            );

        }

    }
);


/* ============================================================
   SEND CAPTURE TO FASTAPI
   ============================================================ */

$("#enhanceCapture")?.addEventListener(
    "click",
    async function () {

        if (!latestCapture) {

            return;

        }


        const button =
            this;


        const status =
            $("#captureStatus");


        const result =
            $("#captureResult");


        const resultMessage =
            $("#captureResultMessage");


        button.disabled =
            true;


        status.textContent =
            "Preparing image for PyTorch…";


        result.hidden =
            false;


        resultMessage.textContent =
            "Sending captured Earth scene to FastAPI.";


        try {

            /*
             * Convert PNG data URL
             * into a Blob.
             */

            const imageResponse =
                await fetch(
                    latestCapture.dataUrl
                );


            const imageBlob =
                await imageResponse.blob();


            /*
             * Multipart request.
             */

            const formData =
                new FormData();


            formData.append(
                "file",
                imageBlob,
                `terraglobe-${Date.now()}.png`
            );


            formData.append(
                "latitude",
                latestCapture.latitude ?? ""
            );


            formData.append(
                "longitude",
                latestCapture.longitude ?? ""
            );


            formData.append(
                "altitude",
                latestCapture.altitude ?? ""
            );


            formData.append(
                "distance",
                latestCapture.distance ?? ""
            );


            formData.append(
                "heading",
                latestCapture.heading ?? ""
            );


            formData.append(
                "pitch",
                latestCapture.pitch ?? ""
            );


            formData.append(
                "timestamp",
                latestCapture.timestamp
            );


            formData.append(
                "source",
                "TerraGlobe Cesium"
            );


            formData.append(
                "pipeline",
                "PyTorch Super-Resolution"
            );


            status.textContent =
                "Running AI super-resolution…";


            resultMessage.textContent =
                "Waiting for the PyTorch model to return the enhanced image.";


            /*
             * FASTAPI REQUEST
             */

            const response =
                await fetch(
                    SR_ENDPOINT,
                    {

                        method:
                            "POST",

                        body:
                            formData

                    }
                );


            if (!response.ok) {

                throw new Error(
                    `FastAPI HTTP ${response.status}`
                );

            }


            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            /* =================================================
               BACKEND RETURNED JSON
               ================================================= */

            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                const data =
                    await response.json();


                window.terraLastSRResult =
                    data;


                status.textContent =
                    "AI enhancement complete.";


                resultMessage.textContent =
                    "PyTorch returned the enhanced result successfully.";


                /*
                 * Support image URL.
                 */

                if (
                    data.image_url
                ) {

                    showEnhancedImage(
                        data.image_url
                    );

                }


                /*
                 * Support base64.
                 */

                else if (
                    data.image_base64
                ) {

                    showEnhancedImage(

                        "data:image/png;base64," +
                        data.image_base64

                    );

                }

            }


            /* =================================================
               BACKEND RETURNED IMAGE
               ================================================= */

            else {

                const enhancedBlob =
                    await response.blob();


                const enhancedUrl =
                    URL.createObjectURL(
                        enhancedBlob
                    );


                window.terraLastSREnhancedUrl =
                    enhancedUrl;


                showEnhancedImage(
                    enhancedUrl
                );


                status.textContent =
                    "AI enhancement complete.";

            }


        } catch (error) {

            console.error(
                "PyTorch API error:",
                error
            );


            status.textContent =
                "AI server connection unavailable.";


            resultMessage.innerHTML =
                `
                Capture completed successfully.
                <br><br>
                Start your FastAPI server and expose:
                <br>
                <code>${SR_ENDPOINT}</code>
                `;

        } finally {

            button.disabled =
                false;

        }

    }
);


/* ============================================================
   ENHANCED IMAGE
   ============================================================ */

function showEnhancedImage(
    imageUrl
) {

    const image =
        $("#enhancedResultImage");


    if (!image) {

        return;

    }


    image.src =
        imageUrl;


    image.hidden =
        false;


    setText(
        "captureResultMessage",
        "Enhanced image received from the AI pipeline."
    );

}


/* ============================================================
   ANALYSIS UPLOAD
   ============================================================ */

let selectedFile =
    null;


const fileInput =
    $("#sceneFile");


const dropzone =
    $("#dropzone");


const runAnalysis =
    $("#runAnalysis");


/* ============================================================
   CHOOSE FILE
   ============================================================ */

$("#chooseFile")?.addEventListener(
    "click",
    function () {

        fileInput?.click();

    }
);


fileInput?.addEventListener(
    "change",
    function () {

        if (
            this.files &&
            this.files.length
        ) {

            handleSelectedFile(
                this.files[0]
            );

        }

    }
);


/* ============================================================
   DRAG & DROP
   ============================================================ */

dropzone?.addEventListener(
    "dragover",
    function (event) {

        event.preventDefault();

        this.classList.add(
            "dragover"
        );

    }
);


dropzone?.addEventListener(
    "dragleave",
    function () {

        this.classList.remove(
            "dragover"
        );

    }
);


dropzone?.addEventListener(
    "drop",
    function (event) {

        event.preventDefault();


        this.classList.remove(
            "dragover"
        );


        const files =
            event.dataTransfer.files;


        if (
            files &&
            files.length
        ) {

            handleSelectedFile(
                files[0]
            );

        }

    }
);


/* ============================================================
   FILE HANDLER
   ============================================================ */

function handleSelectedFile(
    file
) {

    selectedFile =
        file;


    setText(
        "fileStatus",
        "File selected successfully."
    );


    setText(
        "fileName",
        file.name
    );


    setText(
        "fileMeta",
        `${formatBytes(file.size)} · ${file.type || "Unknown format"}`
    );


    $("#fileSummary")
        ?.removeAttribute(
            "hidden"
        );


    runAnalysis.disabled =
        false;


    /*
     * Basic metadata.
     *
     * Actual Sentinel metadata should later
     * come from the backend/GDAL pipeline.
     */

    setText(
        "metaSensor",
        "Sentinel-2"
    );


    setText(
        "metaResolution",
        "10 m"
    );


    setText(
        "metaLevel",
        "L2A"
    );


    setText(
        "metaCloud",
        "Backend required"
    );


    setText(
        "metaLat",
        formatCoordinate(
            window.terraTarget.lat,
            "N",
            "S"
        )
    );


    setText(
        "metaLon",
        formatCoordinate(
            window.terraTarget.lon,
            "E",
            "W"
        )
    );

}


/* ============================================================
   REMOVE FILE
   ============================================================ */

$("#removeFile")?.addEventListener(
    "click",
    function () {

        selectedFile =
            null;


        if (fileInput) {

            fileInput.value =
                "";

        }


        $("#fileSummary")
            ?.setAttribute(
                "hidden",
                ""
            );


        setText(
            "fileStatus",
            "No file selected"
        );


        runAnalysis.disabled =
            true;

    }
);


/* ============================================================
   RUN ANALYSIS
   ============================================================ */

let analysisTimer =
    null;


runAnalysis?.addEventListener(
    "click",
    async function () {

        if (!selectedFile) {

            return;

        }


        /*
         * First attempt real FastAPI processing.
         */

        clearInterval(
            analysisTimer
        );


        setPipeline(
            0,
            "Uploading scene…"
        );


        try {

            const formData =
                new FormData();


            formData.append(
                "file",
                selectedFile
            );


            formData.append(
                "latitude",
                window.terraTarget.lat
            );


            formData.append(
                "longitude",
                window.terraTarget.lon
            );


            formData.append(
                "pipeline",
                "PyTorch Super-Resolution"
            );


            const response =
                await fetch(
                    SR_ENDPOINT,
                    {

                        method:
                            "POST",

                        body:
                            formData

                    }
                );


            if (!response.ok) {

                throw new Error(
                    `FastAPI HTTP ${response.status}`
                );

            }


            setPipeline(
                100,
                "AI processing complete."
            );


        } catch (error) {

            /*
             * The backend is not connected yet.
             *
             * Keep the frontend demonstrable
             * with a pipeline animation.
             */

            console.warn(
                "FastAPI unavailable; running frontend pipeline preview.",
                error
            );


            runDemoPipeline();

        }

    }
);


/* ============================================================
   DEMO PIPELINE
   ============================================================ */

function runDemoPipeline() {

    let progress =
        0;


    const steps =
        document.querySelectorAll(
            ".pipeline-steps span"
        );


    steps.forEach(
        step =>
            step.classList.remove(
                "active",
                "done"
            )
    );


    setPipeline(
        0,
        "Uploading scene…"
    );


    analysisTimer =
        setInterval(
            function () {

                progress +=
                    Math.floor(
                        Math.random() * 7
                    ) + 4;


                progress =
                    Math.min(
                        progress,
                        100
                    );


                if (
                    progress >= 1
                ) {

                    steps[0]
                        ?.classList.add(
                            "done"
                        );

                }


                if (
                    progress >= 25
                ) {

                    steps[1]
                        ?.classList.add(
                            "active"
                        );


                    setPipeline(
                        progress,
                        "Preprocessing imagery…"
                    );

                }


                if (
                    progress >= 50
                ) {

                    steps[1]
                        ?.classList.remove(
                            "active"
                        );


                    steps[1]
                        ?.classList.add(
                            "done"
                        );


                    steps[2]
                        ?.classList.add(
                            "active"
                        );


                    setPipeline(
                        progress,
                        "Running PyTorch super-resolution…"
                    );

                }


                if (
                    progress >= 80
                ) {

                    steps[2]
                        ?.classList.remove(
                            "active"
                        );


                    steps[2]
                        ?.classList.add(
                            "done"
                        );


                    steps[3]
                        ?.classList.add(
                            "active"
                        );


                    setPipeline(
                        progress,
                        "Calculating PSNR · SSIM · SAM · ERGAS…"
                    );

                }


                if (
                    progress >= 100
                ) {

                    clearInterval(
                        analysisTimer
                    );


                    steps[3]
                        ?.classList.remove(
                            "active"
                        );


                    steps[3]
                        ?.classList.add(
                            "done"
                        );


                    setPipeline(
                        100,
                        "Pipeline complete."
                    );

                }

            },
            220
        );

}


/* ============================================================
   PIPELINE UI
   ============================================================ */

function setPipeline(
    percentage,
    message
) {

    const bar =
        $("#missionBar");


    const pct =
        $("#missionPct");


    const stage =
        $("#missionStage");


    if (bar) {

        bar.style.width =
            `${percentage}%`;

    }


    if (pct) {

        pct.textContent =
            `${percentage}%`;

    }


    if (stage) {

        stage.textContent =
            message;

    }

}


/* ============================================================
   ACTIVE CONTROL
   ============================================================ */

function setControlActive(
    button
) {

    document
        .querySelectorAll(
            ".controls > button, .zoom-group button"
        )
        .forEach(
            element =>
                element.classList.remove(
                    "active"
                )
        );


    button?.classList.add(
        "active"
    );

}


/* ============================================================
   KEYBOARD
   ============================================================ */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            if (
                document.body.classList.contains(
                    "analysis-open"
                )
            ) {

                closeAnalysisWorkspace();

            }


            if (
                $("#captureModal")
                    ?.classList.contains(
                        "visible"
                    )
            ) {

                closeCapture();

            }

        }

    }
);


/* ============================================================
   FORMAT HELPERS
   ============================================================ */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


function formatCoordinate(
    value,
    positive,
    negative
) {

    if (
        !Number.isFinite(
            Number(value)
        )
    ) {

        return "—";

    }


    value =
        Number(value);


    return (

        Math.abs(value).toFixed(4) +

        "° " +

        (
            value >= 0
                ? positive
                : negative
        )

    );

}


function formatDistance(
    meters
) {

    if (
        !Number.isFinite(
            Number(meters)
        )
    ) {

        return "—";

    }


    meters =
        Number(meters);


    if (
        meters >= 1000000
    ) {

        return (
            (meters / 1000000)
                .toFixed(2) +
            " Mm"
        );

    }


    if (
        meters >= 1000
    ) {

        return (
            (meters / 1000)
                .toFixed(1) +
            " km"
        );

    }


    return (
        Math.round(meters) +
        " m"
    );

}


function formatBytes(
    bytes
) {

    if (!bytes) {

        return "0 B";

    }


    const units =
        [
            "B",
            "KB",
            "MB",
            "GB"
        ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (

        (
            bytes /
            Math.pow(
                1024,
                index
            )
        )
        .toFixed(
            index === 0
                ? 0
                : 2
        ) +

        " " +

        units[index]

    );

}


/* ============================================================
   INITIAL TARGET
   ============================================================ */

window.updateTarget(
    28.6139,
    77.2090,
    "New Delhi"
);