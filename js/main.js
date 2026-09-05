// ============================================================
// TERRAGLOBE - MAIN APPLICATION
// ============================================================
//
// This file controls the UI.
// globe.js controls the actual Cesium Earth.
// ============================================================

const $ = (selector) =>
    document.querySelector(selector);


// ============================================================
// TARGET STATE
// ============================================================

window.terraTarget = {
    name: "New Delhi",
    lat: 28.6139,
    lon: 77.2090
};


// ============================================================
// NAVIGATION
// ============================================================

const navExplore =
    document.getElementById("navExplore");

const navSR =
    document.getElementById("navSR");

const homeButton =
    document.getElementById("home");

const threeButton =
    document.getElementById("three");


if (navExplore) {

    navExplore.onclick =
        function () {

            enterExplore();

            navExplore.classList.add(
                "active"
            );

            navSR?.classList.remove(
                "active"
            );

        };
}


if (navSR) {

    navSR.onclick =
        function () {

            exitExplore();

            navSR.classList.add(
                "active"
            );

            navExplore?.classList.remove(
                "active"
            );

        };
}


if (threeButton) {

    threeButton.onclick =
        function () {

            enterExplore();

            setActiveControl(
                this
            );

        };
}


if (homeButton) {

    homeButton.onclick =
        function () {

            if (
                window.terraGlobe &&
                window.terraGlobe.enterCinematicMode
            ) {

                window.terraGlobe.enterCinematicMode();

            }

            setActiveControl(
                this
            );

            navExplore?.classList.remove(
                "active"
            );

            navSR?.classList.add(
                "active"
            );

        };
}


function enterExplore() {

    if (
        window.terraGlobe &&
        window.terraGlobe.enterExploreMode
    ) {

        window.terraGlobe.enterExploreMode();

    }

    document.body.classList.add(
        "explore-mode"
    );

    navExplore?.classList.add(
        "active"
    );

    navSR?.classList.remove(
        "active"
    );
}


function exitExplore() {

    if (
        window.terraGlobe &&
        window.terraGlobe.enterCinematicMode
    ) {

        window.terraGlobe.enterCinematicMode();

    }

    document.body.classList.remove(
        "explore-mode"
    );

    navExplore?.classList.remove(
        "active"
    );

    navSR?.classList.add(
        "active"
    );
}


// ============================================================
// ZOOM CONTROLS
// ============================================================

$("#plus")?.addEventListener(
    "click",
    function () {

        if (
            !window.terraGlobe ||
            !window.terraGlobe.viewer
        ) {
            return;
        }

        enterExplore();

        window.terraGlobe.viewer.camera.zoomIn(
            250000
        );

    }
);


$("#minus")?.addEventListener(
    "click",
    function () {

        if (
            !window.terraGlobe ||
            !window.terraGlobe.viewer
        ) {
            return;
        }

        enterExplore();

        window.terraGlobe.viewer.camera.zoomOut(
            250000
        );

    }
);


// ============================================================
// RESET
// ============================================================

$("#reset")?.addEventListener(
    "click",
    function () {

        if (
            window.terraGlobe &&
            window.terraGlobe.resetCamera
        ) {

            window.terraGlobe.resetCamera();

        }

        setActiveControl(
            this
        );

    }
);


// ============================================================
// PIN LOCATION
// ============================================================

$("#pin")?.addEventListener(
    "click",
    function () {

        if (
            window.terraGlobe &&
            window.terraGlobe.pinLocation
        ) {

            window.terraGlobe.pinLocation();

        }

    }
);


// ============================================================
// LOCATE ACTIVE TARGET
// ============================================================

$("#locate")?.addEventListener(
    "click",
    function () {

        if (
            window.terraGlobe &&
            window.terraGlobe.locateTarget
        ) {

            window.terraGlobe.locateTarget();

        }

        setActiveControl(
            this
        );

    }
);


// ============================================================
// FULLSCREEN
// ============================================================

$("#full")?.addEventListener(
    "click",
    async function () {

        try {

            if (
                !document.fullscreenElement
            ) {

                await document.documentElement.requestFullscreen();

            } else {

                await document.exitFullscreen();

            }

        } catch (error) {

            console.warn(
                "Fullscreen unavailable:",
                error
            );

        }

    }
);


// ============================================================
// TARGET LOCK
// ============================================================

let targetLocked = false;


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
                ? "● Target<br>Locked"
                : "◉ Lock<br>Target";

    }
);


// ============================================================
// UPDATE TARGET
// ============================================================

window.updateTarget =
    function (
        latitude,
        longitude,
        name = "Selected Location"
    ) {

        window.terraTarget = {

            name,

            lat: latitude,

            lon: longitude

        };


        const coordinateText =
            `${Math.abs(latitude).toFixed(4)}° ${
                latitude >= 0 ? "N" : "S"
            } · ${
                Math.abs(longitude).toFixed(4)
            }° ${
                longitude >= 0 ? "E" : "W"
            }`;


        const targetCoordinates =
            document.getElementById(
                "targetCoordinates"
            );

        if (targetCoordinates) {

            targetCoordinates.textContent =
                coordinateText;

        }


        const targetMode =
            document.getElementById(
                "targetMode"
            );

        if (targetMode) {

            targetMode.textContent =
                name;

        }


        updateDashboard(
            latitude,
            longitude
        );

    };


// ============================================================
// UPDATE DASHBOARD
// ============================================================

function updateDashboard(
    latitude,
    longitude
) {

    const lat =
        `${Math.abs(latitude).toFixed(4)}° ${
            latitude >= 0 ? "N" : "S"
        }`;

    const lon =
        `${Math.abs(longitude).toFixed(4)}° ${
            longitude >= 0 ? "E" : "W"
        }`;


    const bottomLatLon =
        document.getElementById(
            "bottomLatLon"
        );

    if (bottomLatLon) {

        bottomLatLon.textContent =
            `${lat} ${lon}`;

    }

}


// ============================================================
// SEARCH LOCATION
// ============================================================
//
// Uses OpenStreetMap Nominatim for place search.
// The result is then handled by Cesium's camera.
// ============================================================

const searchInput =
    $("#search");


searchInput?.addEventListener(
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


        this.disabled = true;


        try {

            const url =
                "https://nominatim.openstreetmap.org/search" +
                "?format=json" +
                "&limit=1" +
                "&q=" +
                encodeURIComponent(query);


            const response =
                await fetch(
                    url,
                    {
                        headers: {
                            Accept:
                                "application/json"
                        }
                    }
                );


            if (!response.ok) {
                throw new Error(
                    "Search request failed"
                );
            }


            const results =
                await response.json();


            if (!results.length) {

                alert(
                    `Location "${query}" not found.`
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


            if (
                window.terraGlobe &&
                window.terraGlobe.flyToLocation
            ) {

                window.terraGlobe.flyToLocation(
                    latitude,
                    longitude,
                    250000
                );

            }

        } catch (error) {

            console.error(
                error
            );

            alert(
                "Location search unavailable."
            );

        } finally {

            this.disabled = false;

        }

    }
);


// ============================================================
// RESOLUTION SELECTOR
// ============================================================

const resolutionButtons =
    document.querySelectorAll(
        ".res button"
    );


resolutionButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                resolutionButtons.forEach(
                    function (item) {

                        item.classList.remove(
                            "selected"
                        );

                    }
                );


                this.classList.add(
                    "selected"
                );


                const resolution =
                    this.textContent.trim();


                const targetResolution =
                    document.querySelector(
                        ".row b"
                    );


                if (targetResolution) {

                    targetResolution.innerHTML =
                        `${resolution} <em>(Sub-meter Est.)</em>`;

                }

            }
        );

    }
);


// ============================================================
// MODEL SELECTOR
// ============================================================

const modelSelect =
    document.querySelector(
        "select"
    );


modelSelect?.addEventListener(
    "change",
    function () {

        const subtitle =
            document.querySelector(
                ".dockhead p"
            );


        if (subtitle) {

            subtitle.textContent =
                this.options[
                    this.selectedIndex
                ].text;

        }

    }
);


// ============================================================
// AI INFERENCE
// ============================================================

$("#deploy")?.addEventListener(
    "click",
    function () {

        const progress =
            $("#progress");

        const bar =
            $("#bar");

        const percentage =
            $("#pct");


        if (
            !progress ||
            !bar ||
            !percentage
        ) {
            return;
        }


        progress.classList.add(
            "show"
        );


        bar.style.width =
            "0%";

        percentage.textContent =
            "0%";


        let value = 0;


        const interval =
            setInterval(
                function () {

                    value +=
                        Math.floor(
                            Math.random() * 8
                        ) + 4;


                    value =
                        Math.min(
                            value,
                            100
                        );


                    bar.style.width =
                        `${value}%`;

                    percentage.textContent =
                        `${value}%`;


                    if (
                        value >= 100
                    ) {

                        clearInterval(
                            interval
                        );


                        setTimeout(
                            function () {

                                percentage.textContent =
                                    "READY";

                            },
                            500
                        );

                    }

                },
                180
            );

    }
);


// ============================================================
// INSPECT MODAL
// ============================================================

$("#inspect")?.addEventListener(
    "click",
    function () {

        $("#modal")?.classList.remove(
            "hidden"
        );

    }
);


$("#close")?.addEventListener(
    "click",
    function () {

        $("#modal")?.classList.add(
            "hidden"
        );

    }
);


$("#modal")?.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            $("#modal")
        ) {

            $("#modal").classList.add(
                "hidden"
            );

        }

    }
);


// ============================================================
// GEOJSON EXPORT
// ============================================================

$("#geojson")?.addEventListener(
    "click",
    function () {

        const target =
            window.terraTarget;


        const offset =
            0.01;


        const geojson = {

            type:
                "FeatureCollection",

            features: [

                {

                    type:
                        "Feature",

                    properties: {

                        name:
                            target.name,

                        tile:
                            "ACTIVE-TILE",

                        resolution:
                            document
                                .querySelector(
                                    ".res .selected"
                                )
                                ?.textContent ||
                            "1.25m",

                        confidence:
                            0.968

                    },

                    geometry: {

                        type:
                            "Polygon",

                        coordinates: [

                            [

                                [
                                    target.lon - offset,
                                    target.lat - offset
                                ],

                                [
                                    target.lon + offset,
                                    target.lat - offset
                                ],

                                [
                                    target.lon + offset,
                                    target.lat + offset
                                ],

                                [
                                    target.lon - offset,
                                    target.lat + offset
                                ],

                                [
                                    target.lon - offset,
                                    target.lat - offset
                                ]

                            ]

                        ]

                    }

                }

            ]

        };


        const blob =
            new Blob(
                [
                    JSON.stringify(
                        geojson,
                        null,
                        2
                    )
                ],
                {
                    type:
                        "application/geo+json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;

        link.download =
            "terraglobe-active-location.geojson";


        document.body.appendChild(
            link
        );


        link.click();

        link.remove();


        URL.revokeObjectURL(
            url
        );

    }
);


// ============================================================
// GEOTIFF
// ============================================================

$("#tiff")?.addEventListener(
    "click",
    function () {

        alert(
            "GeoTIFF export requires your GeoSR FastAPI/Python backend. " +
            "The selected latitude/longitude can be sent to the model here."
        );

    }
);


// ============================================================
// ACTIVE CONTROL
// ============================================================

function setActiveControl(
    button
) {

    document
        .querySelectorAll(
            ".controls > button"
        )
        .forEach(
            function (item) {

                item.classList.remove(
                    "active"
                );

            }
        );


    button.classList.add(
        "active"
    );

}


// ============================================================
// TOOLTIP CONTENT
// ============================================================

const tooltips = {

    home:
        "Home — cinematic rotating Earth",

    three:
        "Explore 3D — interactive Earth",

    plus:
        "Zoom In — move closer",

    minus:
        "Zoom Out — move farther away",

    reset:
        "Reset Camera — restore orientation",

    pin:
        "Pin Location — then click anywhere on Earth",

    locate:
        "Locate Target — fly to selected location",

    full:
        "Fullscreen — expand TerraGlobe"

};


Object.entries(
    tooltips
).forEach(
    function ([id, text]) {

        const element =
            document.getElementById(
                id
            );


        if (element) {

            element.setAttribute(
                "data-tooltip",
                text
            );

        }

    }
);


// ============================================================
// INITIAL TARGET
// ============================================================

window.updateTarget(
    28.6139,
    77.2090,
    "New Delhi"
);
