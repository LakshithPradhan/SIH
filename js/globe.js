// ============================================================
// TERRAGLOBE - REAL 3D GLOBE ENGINE
// ============================================================
//
// Modes:
//
// 1. CINEMATIC
//    - Real 3D Earth
//    - Fixed camera distance
//    - Slow automatic rotation
//    - No user zoom / rotate / tilt
//
// 2. EXPLORE 3D
//    - Full Cesium interaction
//    - Zoom
//    - Rotate
//    - Tilt
//    - Search/fly-to
//    - Pin locations
//    - Live latitude / longitude / altitude / distance
//
// Google Photorealistic 3D Tiles:
// Put your Google Maps Platform API key below if you have one.
// The rest of the application works without it using ArcGIS imagery.
// ============================================================

const GOOGLE_3D_TILES_API_KEY = "";

let viewer = null;

let worldImageryLayer = null;
let placeLabelsLayer = null;
let googleTileset = null;

let pinEntity = null;
let pinMode = false;
let exploreMode = false;

let cinematicOrbitTimer = null;

const DEFAULT_LOCATION = {
    latitude: 28.6139,
    longitude: 77.2090
};

const INITIAL_CAMERA_HEIGHT = 14500000;


// ============================================================
// CREATE VIEWER
// ============================================================

async function initializeGlobe() {

    const container = document.getElementById("cesiumContainer");

    if (!container) {
        console.error("Cesium container not found.");
        return;
    }

   viewer = new Cesium.Viewer(container, {

    animation: false,
    timeline: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,

    // Do not pass globe: true.
    // Cesium creates the normal 3D Earth automatically.
    baseLayer: false,

    creditContainer: document.createElement("div")
});


    // ========================================================
    // SCENE QUALITY
    // ========================================================

    viewer.scene.globe.show = true;

    viewer.scene.globe.enableLighting = true;

    viewer.scene.globe.maximumScreenSpaceError = 2;

    viewer.scene.skyAtmosphere.show = true;

    viewer.scene.fog.enabled = true;

    viewer.scene.fog.density = 0.000015;

    viewer.scene.backgroundColor =
        Cesium.Color.fromCssColorString("#02070d");


    // ========================================================
    // SATELLITE IMAGERY
    // ========================================================

    try {

        const imageryProvider =
            await Cesium.ArcGisMapServerImageryProvider.fromUrl(
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
            );

        worldImageryLayer =
            viewer.imageryLayers.addImageryProvider(
                imageryProvider
            );

    } catch (error) {

        console.error(
            "World imagery could not be loaded:",
            error
        );

    }


    // ========================================================
    // WORLD PLACES + COUNTRY LABELS
    // ========================================================
    //
    // This is what the old globe was missing.
    // It overlays country boundaries and place names over
    // satellite imagery.
    //
    // ArcGIS documents this layer as a reference layer for
    // imagery basemaps.
    // ========================================================

    try {

        const labelsProvider =
            await Cesium.ArcGisMapServerImageryProvider.fromUrl(
                "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer"
            );

        placeLabelsLayer =
            viewer.imageryLayers.addImageryProvider(
                labelsProvider
            );

        placeLabelsLayer.alpha = 0.95;

    } catch (error) {

        console.warn(
            "Place labels could not be loaded:",
            error
        );

    }


    // ========================================================
    // OPTIONAL GOOGLE PHOTOREALISTIC 3D TILES
    // ========================================================

    if (GOOGLE_3D_TILES_API_KEY.trim()) {

        try {

            googleTileset =
                await Cesium.createGooglePhotorealistic3DTileset(
                    {
                        key: GOOGLE_3D_TILES_API_KEY,
                        onlyUsingWithGoogleGeocoder: true
                    }
                );

            viewer.scene.primitives.add(
                googleTileset
            );

            console.log(
                "Google Photorealistic 3D Tiles loaded."
            );

        } catch (error) {

            console.error(
                "Google Photorealistic 3D Tiles failed:",
                error
            );

        }

    }


    // ========================================================
    // INITIAL CAMERA
    // ========================================================

    viewer.camera.setView({

        destination:
            Cesium.Cartesian3.fromDegrees(
                DEFAULT_LOCATION.longitude,
                DEFAULT_LOCATION.latitude,
                INITIAL_CAMERA_HEIGHT
            ),

        orientation: {

            heading:
                Cesium.Math.toRadians(0),

            pitch:
                Cesium.Math.toRadians(-90),

            roll: 0

        }

    });


    // ========================================================
    // START CINEMATIC MODE
    // ========================================================

    setCinematicMode();


    // ========================================================
    // CAMERA TELEMETRY
    // ========================================================

    viewer.scene.postRender.addEventListener(
        updateCameraTelemetry
    );


    // ========================================================
    // EARTH CLICK HANDLER
    // ========================================================

    const handler =
        new Cesium.ScreenSpaceEventHandler(
            viewer.scene.canvas
        );


    handler.setInputAction(
        function (movement) {

            if (!exploreMode) {
                return;
            }

            if (!pinMode) {
                return;
            }

            placePinFromScreenPosition(
                movement.position
            );

        },
        Cesium.ScreenSpaceEventType.LEFT_CLICK
    );


    window.terraGlobe = {

        viewer,

        enterExploreMode,

        enterCinematicMode,

        pinLocation,

        clearPin,

        flyToLocation,

        resetCamera,

        locateTarget

    };
}


// ============================================================
// CINEMATIC MODE
// ============================================================

function setCinematicMode() {

    if (!viewer) {
        return;
    }

    exploreMode = false;
    pinMode = false;

    stopCinematicRotation();

    const controller =
        viewer.scene.screenSpaceCameraController;

    controller.enableInputs = false;

    controller.enableRotate = false;
    controller.enableZoom = false;
    controller.enableTilt = false;
    controller.enableTranslate = false;
    controller.enableLook = false;


    viewer.camera.setView({

        destination:
            Cesium.Cartesian3.fromDegrees(
                DEFAULT_LOCATION.longitude,
                DEFAULT_LOCATION.latitude,
                INITIAL_CAMERA_HEIGHT
            ),

        orientation: {

            heading:
                Cesium.Math.toRadians(0),

            pitch:
                Cesium.Math.toRadians(-90),

            roll: 0

        }

    });


    startCinematicRotation();

    setExploreState("CINEMATIC");

    document.body.classList.remove(
        "explore-mode"
    );

    document.body.classList.add(
        "cinematic-mode"
    );
}


// ============================================================
// CINEMATIC ROTATION
// ============================================================
//
// The camera slowly orbits around the Earth.
// The distance is kept essentially constant, so the user
// sees a space-style rotating planet rather than a map zoom.
// ============================================================

function startCinematicRotation() {

    stopCinematicRotation();

    let angle = 0;

    const orbitCenter =
        Cesium.Cartesian3.fromDegrees(
            DEFAULT_LOCATION.longitude,
            DEFAULT_LOCATION.latitude,
            0
        );

    cinematicOrbitTimer =
        window.setInterval(
            function () {

                if (!viewer || exploreMode) {
                    return;
                }

                angle += 0.00055;

                const longitude =
                    DEFAULT_LOCATION.longitude +
                    Cesium.Math.toDegrees(angle);

                viewer.camera.setView({

                    destination:
                        Cesium.Cartesian3.fromDegrees(
                            longitude,
                            DEFAULT_LOCATION.latitude,
                            INITIAL_CAMERA_HEIGHT
                        ),

                    orientation: {

                        heading:
                            Cesium.Math.toRadians(0),

                        pitch:
                            Cesium.Math.toRadians(-90),

                        roll: 0

                    }

                });

            },
            40
        );
}


function stopCinematicRotation() {

    if (cinematicOrbitTimer !== null) {

        clearInterval(
            cinematicOrbitTimer
        );

        cinematicOrbitTimer = null;
    }
}


// ============================================================
// EXPLORE 3D MODE
// ============================================================

function enterExploreMode() {

    if (!viewer) {
        return;
    }

    exploreMode = true;

    stopCinematicRotation();

    const controller =
        viewer.scene.screenSpaceCameraController;

    controller.enableInputs = true;

    controller.enableRotate = true;
    controller.enableZoom = true;
    controller.enableTilt = true;
    controller.enableTranslate = true;
    controller.enableLook = true;

    controller.inertiaSpin = 0.88;
    controller.inertiaTranslate = 0.85;
    controller.inertiaZoom = 0.75;

    controller.enableCollisionDetection = true;

    setExploreState("INTERACTIVE");

    document.body.classList.remove(
        "cinematic-mode"
    );

    document.body.classList.add(
        "explore-mode"
    );
}


// ============================================================
// PIN LOCATION MODE
// ============================================================

function pinLocation() {

    if (!viewer) {
        return;
    }

    enterExploreMode();

    pinMode = true;

    document.body.classList.add(
        "pin-mode"
    );

    const pinButton =
        document.getElementById("pin");

    if (pinButton) {
        pinButton.classList.add("active");
    }

    setExploreState(
        "PIN MODE — CLICK EARTH"
    );
}


function placePinFromScreenPosition(
    screenPosition
) {

    if (!viewer) {
        return;
    }

    let cartesian = null;


    // First try actual 3D scene geometry.
    if (
        viewer.scene.pickPositionSupported
    ) {

        cartesian =
            viewer.scene.pickPosition(
                screenPosition
            );

    }


    // Fallback to the globe ellipsoid.
    if (
        !Cesium.defined(cartesian)
    ) {

        const ray =
            viewer.camera.getPickRay(
                screenPosition
            );

        if (ray) {

            cartesian =
                viewer.scene.globe.pick(
                    ray,
                    viewer.scene
                );

        }

    }


    if (
        !Cesium.defined(cartesian)
    ) {

        return;
    }


    const cartographic =
        Cesium.Cartographic.fromCartesian(
            cartesian
        );

    const latitude =
        Cesium.Math.toDegrees(
            cartographic.latitude
        );

    const longitude =
        Cesium.Math.toDegrees(
            cartographic.longitude
        );

    const height =
        Math.max(
            0,
            cartographic.height || 0
        );


    createOrMovePin(
        longitude,
        latitude,
        height
    );


    window.updateTarget(
        latitude,
        longitude,
        "Pinned Location"
    );


    pinMode = false;

    document.body.classList.remove(
        "pin-mode"
    );

    const pinButton =
        document.getElementById("pin");

    if (pinButton) {
        pinButton.classList.remove(
            "active"
        );
    }

    setExploreState(
        "PINNED LOCATION"
    );
}


// ============================================================
// CREATE / MOVE PIN
// ============================================================

function createOrMovePin(
    longitude,
    latitude,
    height = 0
) {

    if (pinEntity) {

        pinEntity.position =
            Cesium.Cartesian3.fromDegrees(
                longitude,
                latitude,
                height
            );

        return;
    }


    pinEntity =
        viewer.entities.add({

            name: "TerraGlobe Pinned Location",

            position:
                Cesium.Cartesian3.fromDegrees(
                    longitude,
                    latitude,
                    height
                ),

            point: {

                pixelSize: 13,

                color:
                    Cesium.Color.fromCssColorString(
                        "#00d2ff"
                    ),

                outlineColor:
                    Cesium.Color.WHITE,

                outlineWidth: 2,

                heightReference:
                    Cesium.HeightReference.NONE

            },

            label: {

                text: "PINNED LOCATION",

                font:
                    "600 12px Space Grotesk, sans-serif",

                fillColor:
                    Cesium.Color.WHITE,

                outlineColor:
                    Cesium.Color.BLACK,

                outlineWidth: 4,

                style:
                    Cesium.LabelStyle.FILL_AND_OUTLINE,

                verticalOrigin:
                    Cesium.VerticalOrigin.BOTTOM,

                pixelOffset:
                    new Cesium.Cartesian2(
                        0,
                        -18
                    )

            }

        });
}


// ============================================================
// CLEAR PIN
// ============================================================

function clearPin() {

    if (!viewer || !pinEntity) {
        return;
    }

    viewer.entities.remove(
        pinEntity
    );

    pinEntity = null;
}


// ============================================================
// FLY TO LOCATION
// ============================================================

function flyToLocation(
    latitude,
    longitude,
    height = 250000
) {

    if (!viewer) {
        return;
    }

    enterExploreMode();

    viewer.camera.flyTo({

        destination:
            Cesium.Cartesian3.fromDegrees(
                longitude,
                latitude,
                height
            ),

        orientation: {

            heading:
                Cesium.Math.toRadians(0),

            pitch:
                Cesium.Math.toRadians(-65),

            roll: 0

        },

        duration: 2.2

    });


    window.updateTarget(
        latitude,
        longitude,
        "Search Result"
    );
}


// ============================================================
// RESET CAMERA
// ============================================================

function resetCamera() {

    if (!viewer) {
        return;
    }

    enterExploreMode();

    viewer.camera.flyTo({

        destination:
            Cesium.Cartesian3.fromDegrees(
                DEFAULT_LOCATION.longitude,
                DEFAULT_LOCATION.latitude,
                1000000
            ),

        orientation: {

            heading: 0,

            pitch:
                Cesium.Math.toRadians(-90),

            roll: 0

        },

        duration: 1.5

    });
}


// ============================================================
// LOCATE ACTIVE TARGET
// ============================================================

function locateTarget() {

    if (!viewer) {
        return;
    }

    const target =
        window.terraTarget || DEFAULT_LOCATION;

    enterExploreMode();

    viewer.camera.flyTo({

        destination:
            Cesium.Cartesian3.fromDegrees(
                target.lon,
                target.lat,
                250000
            ),

        orientation: {

            heading: 0,

            pitch:
                Cesium.Math.toRadians(-65),

            roll: 0

        },

        duration: 1.8

    });
}


// ============================================================
// CAMERA TELEMETRY
// ============================================================

function updateCameraTelemetry() {

    if (!viewer) {
        return;
    }

    const camera =
        viewer.camera;

    const cartographic =
        camera.positionCartographic;

    if (!cartographic) {
        return;
    }

    const latitude =
        Cesium.Math.toDegrees(
            cartographic.latitude
        );

    const longitude =
        Cesium.Math.toDegrees(
            cartographic.longitude
        );

    const altitude =
        Math.max(
            0,
            cartographic.height
        );


    const earthRadius =
        Cesium.Ellipsoid.WGS84.maximumRadius;

    const distanceFromCenter =
        Cesium.Cartesian3.magnitude(
            camera.positionWC
        );

    const groundDistance =
        Math.max(
            0,
            distanceFromCenter -
            earthRadius
        );


    const heading =
        Cesium.Math.toDegrees(
            Cesium.Math.zeroToTwoPi(
                camera.heading
            )
        );

    const pitch =
        Cesium.Math.toDegrees(
            camera.pitch
        );


    updateText(
        "telemetryLat",
        formatLatitude(latitude)
    );

    updateText(
        "telemetryLon",
        formatLongitude(longitude)
    );

    updateText(
        "telemetryAlt",
        formatDistance(altitude)
    );

    updateText(
        "telemetryDistance",
        formatDistance(groundDistance)
    );

    updateText(
        "telemetryHeading",
        `${heading.toFixed(1)}°`
    );

    updateText(
        "telemetryPitch",
        `${pitch.toFixed(1)}°`
    );


    updateText(
        "alt",
        formatDistance(altitude)
    );

    updateText(
        "bottomDistance",
        formatDistance(groundDistance)
    );


    if (exploreMode) {

        // The camera's globe position is useful telemetry.
        // The selected target remains separate.
        updateText(
            "bottomLatLon",
            `${formatLatitude(latitude)} ${formatLongitude(longitude)}`
        );

    }

}


// ============================================================
// HELPERS
// ============================================================

function updateText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function formatLatitude(
    latitude
) {

    return `${Math.abs(latitude).toFixed(4)}° ${
        latitude >= 0 ? "N" : "S"
    }`;
}


function formatLongitude(
    longitude
) {

    return `${Math.abs(longitude).toFixed(4)}° ${
        longitude >= 0 ? "E" : "W"
    }`;
}


function formatDistance(
    meters
) {

    if (!Number.isFinite(meters)) {
        return "--";
    }

    if (meters >= 1000000) {

        return `${
            (meters / 1000000).toFixed(2)
        } Mm`;

    }

    if (meters >= 1000) {

        return `${
            (meters / 1000).toFixed(1)
        } km`;

    }

    return `${meters.toFixed(0)} m`;
}


function setExploreState(
    text
) {

    updateText(
        "exploreState",
        text
    );
}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeGlobe
);
