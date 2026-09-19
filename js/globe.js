/* ============================================================
   TERRAGLOBE
   CESIUM EARTH ENGINE
   ============================================================ */

"use strict";


/* ============================================================
   CONFIG
   ============================================================ */

const GOOGLE_3D_TILES_API_KEY = "";


const DEFAULT_LOCATION = {

    latitude:
        28.6139,

    longitude:
        77.2090

};


const INITIAL_CAMERA_HEIGHT =
    14500000;


/* ============================================================
   STATE
   ============================================================ */

let viewer = null;

let worldImageryLayer = null;

let placeLabelsLayer = null;

let googleTileset = null;

let pinEntity = null;

let pinMode = false;

let exploreMode = false;

let cinematicRotation = null;


/* ============================================================
   INITIALIZE
   ============================================================ */

async function initializeGlobe() {

    const container =
        document.getElementById(
            "cesiumContainer"
        );


    if (!container) {

        console.error(
            "Cesium container not found."
        );

        return;

    }


    viewer =
        new Cesium.Viewer(
            container,
            {

                animation:
                    false,

                timeline:
                    false,

                baseLayerPicker:
                    false,

                geocoder:
                    false,

                homeButton:
                    false,

                sceneModePicker:
                    false,

                navigationHelpButton:
                    false,

                fullscreenButton:
                    false,

                infoBox:
                    false,

                selectionIndicator:
                    false,

                baseLayer:
                    false,

                creditContainer:
                    document.createElement(
                        "div"
                    ),

                contextOptions:
                    {

                        webgl:
                            {

                                preserveDrawingBuffer:
                                    true

                            }

                    }

            }
        );


    /* ========================================================
       CORRECT EARTH SUNLIGHT
       ======================================================== */

    /*
     * Cesium calculates the Sun position from the clock.
     *
     * The selected time puts India/New Delhi on the
     * daylight side.
     *
     * The opposite hemisphere is therefore naturally
     * dark.
     */

    viewer.clock.currentTime =
        Cesium.JulianDate.fromIso8601(
            "2026-09-18T08:00:00Z"
        );


    viewer.clock.shouldAnimate =
        false;


    const globe =
        viewer.scene.globe;


    /*
     * IMPORTANT:
     *
     * Do not fake day/night using CSS filters.
     *
     * Cesium's actual globe lighting is used.
     */

    globe.enableLighting =
        true;


    globe.dynamicAtmosphereLighting =
        true;


    globe.dynamicAtmosphereLightingFromSun =
        true;


    globe.showGroundAtmosphere =
        true;


    /*
     * Use Cesium's actual Sun as the scene light.
     */

    viewer.scene.light =
        new Cesium.SunLight();


    /* ========================================================
       EARTH QUALITY
       ======================================================== */

    globe.maximumScreenSpaceError =
        1;


    viewer.scene.skyAtmosphere.show =
        true;


    viewer.scene.skyAtmosphere.hueShift =
        0;


    viewer.scene.skyAtmosphere.saturationShift =
        0.6;


    viewer.scene.skyAtmosphere.brightnessShift =
        0.05;


    viewer.scene.fog.enabled =
        true;


    viewer.scene.fog.density =
        0.000012;


    viewer.scene.backgroundColor =
        Cesium.Color.fromCssColorString(
            "#01050a"
        );


    viewer.scene.highDynamicRange =
        true;


    /* ========================================================
       SATELLITE IMAGERY
       ======================================================== */

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
            "World imagery failed:",
            error
        );

    }


    /* ========================================================
       COUNTRY / PLACE LABELS
       ======================================================== */

    try {

        const labelsProvider =
            await Cesium.ArcGisMapServerImageryProvider.fromUrl(
                "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer"
            );


        placeLabelsLayer =
            viewer.imageryLayers.addImageryProvider(
                labelsProvider
            );


        placeLabelsLayer.alpha =
            0.95;


    } catch (error) {

        console.warn(
            "Reference labels unavailable:",
            error
        );

    }


    /* ========================================================
       OPTIONAL GOOGLE 3D TILES
       ======================================================== */

    if (
        GOOGLE_3D_TILES_API_KEY &&
        GOOGLE_3D_TILES_API_KEY.trim()
    ) {

        try {

            googleTileset =
                await Cesium.createGooglePhotorealistic3DTileset(
                    {
                        key:
                            GOOGLE_3D_TILES_API_KEY
                    }
                );


            viewer.scene.primitives.add(
                googleTileset
            );


        } catch (error) {

            console.error(
                "Google 3D Tiles failed:",
                error
            );

        }

    }


    /* ========================================================
       CAMERA
       ======================================================== */

    setSpaceCamera();


    /* ========================================================
       CINEMATIC MODE
       ======================================================== */

    enterCinematicMode();


    /* ========================================================
       TELEMETRY
       ======================================================== */

    viewer.scene.postRender.addEventListener(
        updateCameraTelemetry
    );


    /* ========================================================
       EARTH CLICK / PIN
       ======================================================== */

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


    /* ========================================================
       PUBLIC API
       ======================================================== */

    window.terraGlobe = {

        viewer,

        enterExploreMode,

        enterCinematicMode,

        pinLocation,

        clearPin,

        flyToLocation,

        resetCamera,

        locateTarget,

        captureCurrentView

    };

}


/* ============================================================
   SPACE CAMERA
   ============================================================ */

function setSpaceCamera() {

    if (!viewer) {

        return;

    }


    viewer.camera.setView(

        {

            destination:
                Cesium.Cartesian3.fromDegrees(

                    DEFAULT_LOCATION.longitude,

                    DEFAULT_LOCATION.latitude,

                    INITIAL_CAMERA_HEIGHT

                ),


            orientation:
                {

                    heading:
                        0,

                    pitch:
                        Cesium.Math.toRadians(
                            -90
                        ),

                    roll:
                        0

                }

        }

    );

}


/* ============================================================
   CINEMATIC MODE
   ============================================================ */

function enterCinematicMode() {

    if (!viewer) {

        return;

    }


    exploreMode =
        false;


    pinMode =
        false;


    stopCinematicRotation();


    const controller =
        viewer.scene
            .screenSpaceCameraController;


    controller.enableInputs =
        false;


    controller.enableRotate =
        false;


    controller.enableZoom =
        false;


    controller.enableTilt =
        false;


    controller.enableTranslate =
        false;


    controller.enableLook =
        false;


    document.body.classList.remove(
        "explore-mode",
        "pin-mode"
    );


    document.body.classList.add(
        "cinematic-mode"
    );


    setExploreState(
        "CINEMATIC EARTH"
    );


    setSpaceCamera();


    /*
     * Give Cesium a frame after the camera
     * is positioned before starting rotation.
     */

    viewer.scene.requestRender();


    startCinematicRotation();

}


/* ============================================================
   CINEMATIC ROTATION
   ============================================================ */

function startCinematicRotation() {

    stopCinematicRotation();


    let lastTime =
        performance.now();


    cinematicRotation =
        function () {

            if (
                !viewer ||
                exploreMode
            ) {

                return;

            }


            const now =
                performance.now();


            const delta =
                Math.min(
                    (now - lastTime) / 1000,
                    0.1
                );


            lastTime =
                now;


            /*
             * Slow, continuous rotation.
             *
             * The camera moves around the Earth,
             * while the Sun remains fixed.
             *
             * This means the daylight terminator
             * remains physically consistent.
             */

            viewer.camera.rotateRight(

                Cesium.Math.toRadians(
                    0.45
                ) * delta

            );

        };


    viewer.scene.postRender.addEventListener(
        cinematicRotation
    );

}


/* ============================================================
   STOP ROTATION
   ============================================================ */

function stopCinematicRotation() {

    if (
        viewer &&
        cinematicRotation
    ) {

        viewer.scene.postRender.removeEventListener(
            cinematicRotation
        );

    }


    cinematicRotation =
        null;

}


/* ============================================================
   EXPLORE 3D
   ============================================================ */

function enterExploreMode() {

    if (!viewer) {

        return;

    }


    exploreMode =
        true;


    stopCinematicRotation();


    const controller =
        viewer.scene
            .screenSpaceCameraController;


    controller.enableInputs =
        true;


    controller.enableRotate =
        true;


    controller.enableZoom =
        true;


    controller.enableTilt =
        true;


    controller.enableTranslate =
        true;


    controller.enableLook =
        true;


    controller.inertiaSpin =
        0.88;


    controller.inertiaTranslate =
        0.85;


    controller.inertiaZoom =
        0.75;


    controller.enableCollisionDetection =
        true;


    document.body.classList.remove(
        "cinematic-mode"
    );


    document.body.classList.add(
        "explore-mode"
    );


    setExploreState(
        "INTERACTIVE 3D EARTH"
    );


    viewer.scene.requestRender();

}


/* ============================================================
   PIN MODE
   ============================================================ */

function pinLocation() {

    if (!viewer) {

        return;

    }


    enterExploreMode();


    pinMode =
        true;


    document.body.classList.add(
        "pin-mode"
    );


    const pinButton =
        document.getElementById(
            "pin"
        );


    pinButton?.classList.add(
        "active"
    );


    setExploreState(
        "PIN MODE · CLICK EARTH"
    );

}


/* ============================================================
   PLACE PIN
   ============================================================ */

function placePinFromScreenPosition(
    screenPosition
) {

    if (!viewer) {

        return;

    }


    let cartesian =
        null;


    /*
     * Try 3D pick first.
     */

    if (
        viewer.scene.pickPositionSupported
    ) {

        cartesian =
            viewer.scene.pickPosition(
                screenPosition
            );

    }


    /*
     * Fallback to globe intersection.
     */

    if (
        !Cesium.defined(
            cartesian
        )
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
        !Cesium.defined(
            cartesian
        )
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


    clearPin();


    pinEntity =
        viewer.entities.add({

            position:
                Cesium.Cartesian3.fromRadians(

                    cartographic.longitude,

                    cartographic.latitude,

                    height + 100

                ),


            point:
                {

                    pixelSize:
                        12,

                    color:
                        Cesium.Color.fromCssColorString("#5FC98A"),

                    outlineColor:
                        Cesium.Color.WHITE,

                    outlineWidth:
                        2,

                    disableDepthTestDistance:
                        Number.POSITIVE_INFINITY

                },


            label:
                {

                    text:
                        `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,

                    font:
                        "11px 'General Sans'",

                    fillColor:
                        Cesium.Color.WHITE,

                    style:
                        Cesium.LabelStyle.FILL_AND_OUTLINE,

                    outlineColor:
                        Cesium.Color.BLACK,

                    outlineWidth:
                        3,

                    pixelOffset:
                        new Cesium.Cartesian2(
                            0,
                            -22
                        ),

                    disableDepthTestDistance:
                        Number.POSITIVE_INFINITY

                }

        });


    pinMode =
        false;


    document.body.classList.remove(
        "pin-mode"
    );


    document.getElementById(
        "pin"
    )?.classList.remove(
        "active"
    );


    window.updateTarget?.(
        latitude,
        longitude,
        "Pinned Location"
    );


    setExploreState(
        "LOCATION PINNED"
    );

}


/* ============================================================
   CLEAR PIN
   ============================================================ */

function clearPin() {

    if (
        viewer &&
        pinEntity
    ) {

        viewer.entities.remove(
            pinEntity
        );

    }


    pinEntity =
        null;

}


/* ============================================================
   FLY TO LOCATION
   ============================================================ */

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


        duration:
            2.2

    });

}


/* ============================================================
   RESET CAMERA
   ============================================================ */

function resetCamera() {

    if (!viewer) {

        return;

    }


    clearPin();


    enterExploreMode();


    viewer.camera.flyTo({

        destination:
            Cesium.Cartesian3.fromDegrees(

                DEFAULT_LOCATION.longitude,

                DEFAULT_LOCATION.latitude,

                5000000

            ),


        orientation:
            {

                heading:
                    0,

                pitch:
                    Cesium.Math.toRadians(
                        -90
                    ),

                roll:
                    0

            },


        duration:
            1.6

    });


    setExploreState(
        "INTERACTIVE 3D EARTH"
    );

}


/* ============================================================
   LOCATE TARGET
   ============================================================ */

function locateTarget() {

    if (
        !window.terraTarget
    ) {

        return;

    }


    flyToLocation(

        window.terraTarget.lat,

        window.terraTarget.lon,

        250000

    );

}


/* ============================================================
   TELEMETRY
   ============================================================ */

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


    const distance =
        Math.max(
            0,
            Cesium.Cartesian3.magnitude(
                camera.positionWC
            ) -
            Cesium.Ellipsoid.WGS84.maximumRadius
        );


    setText(
        "telemetryLat",
        formatCoordinate(
            latitude,
            "N",
            "S"
        )
    );


    setText(
        "telemetryLon",
        formatCoordinate(
            longitude,
            "E",
            "W"
        )
    );


    setText(
        "telemetryAlt",
        formatDistance(
            altitude
        )
    );


    setText(
        "telemetryDistance",
        formatDistance(
            distance
        )
    );


    setText(
        "telemetryHeading",
        `${heading.toFixed(1)}°`
    );


    setText(
        "telemetryPitch",
        `${pitch.toFixed(1)}°`
    );


    setText(
        "bottomLatLon",
        `${formatCoordinate(latitude,"N","S")} ${formatCoordinate(longitude,"E","W")}`
    );


    setText(
        "alt",
        formatDistance(
            altitude
        )
    );


    setText(
        "bottomDistance",
        formatDistance(
            distance
        )
    );

}


/* ============================================================
   CAPTURE CURRENT CESIUM VIEW
   ============================================================ */

function captureCurrentView() {

    if (!viewer) {

        return null;

    }


    /*
     * Render first so the canvas contains
     * the latest frame.
     */

    viewer.render();


    const canvas =
        viewer.scene.canvas;


    const dataUrl =
        canvas.toDataURL(
            "image/png"
        );


    /*
     * Find the ground point under
     * the center of the screen.
     */

    const center =
        new Cesium.Cartesian2(

            canvas.clientWidth / 2,

            canvas.clientHeight / 2

        );


    let ground =
        null;


    const ray =
        viewer.camera.getPickRay(
            center
        );


    if (ray) {

        ground =
            viewer.scene.globe.pick(
                ray,
                viewer.scene
            );

    }


    let latitude =
        null;


    let longitude =
        null;


    if (
        Cesium.defined(
            ground
        )
    ) {

        const cartographic =
            Cesium.Cartographic.fromCartesian(
                ground
            );


        latitude =
            Cesium.Math.toDegrees(
                cartographic.latitude
            );


        longitude =
            Cesium.Math.toDegrees(
                cartographic.longitude
            );

    }


    const cartographic =
        viewer.camera.positionCartographic;


    const altitude =
        cartographic
            ? Math.max(
                0,
                cartographic.height
            )
            : 0;


    const distance =
        Math.max(
            0,
            Cesium.Cartesian3.magnitude(
                viewer.camera.positionWC
            ) -
            Cesium.Ellipsoid.WGS84.maximumRadius
        );


    const heading =
        Cesium.Math.toDegrees(
            Cesium.Math.zeroToTwoPi(
                viewer.camera.heading
            )
        );


    const pitch =
        Cesium.Math.toDegrees(
            viewer.camera.pitch
        );


    return {

        dataUrl,

        width:
            canvas.width,

        height:
            canvas.height,

        latitude,

        longitude,

        altitude,

        distance,

        heading,

        pitch,

        timestamp:
            new Date().toISOString()

    };

}


/* ============================================================
   HELPERS
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
            value
        )
    ) {

        return "—";

    }


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
            meters
        )
    ) {

        return "—";

    }


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


function setExploreState(
    value
) {

    setText(
        "exploreState",
        value
    );

}


/* ============================================================
   START
   ============================================================ */

window.addEventListener(
    "load",
    initializeGlobe
);