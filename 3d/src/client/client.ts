import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'

const scene = new THREE.Scene()
scene.add(new THREE.AxesHelper(5))

const light2 = new THREE.AmbientLight( 0xffffff ); // soft white light
scene.add( light2 );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
scene.add( directionalLight );

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(0.8, 1.4, 1.0)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor( 0xEEEEEE, 1 );
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 1, 0)

let mixer: THREE.AnimationMixer
let modelReady = false
const animationActions: THREE.AnimationAction[] = []
let activeAction: THREE.AnimationAction
let lastAction: THREE.AnimationAction

const loadingManager = new THREE.LoadingManager();
const wrongUrl = new RegExp(".*forux.*", "g");
loadingManager.setURLModifier( function( url ) {
    if (wrongUrl.test(url)) {
        console.log(url);
        let arr = url.split("/");
        console.log(arr[arr.length-2] + "/" + arr[arr.length-1]);
        return "/models/chars/" + arr[arr.length-3] + "/" + arr[arr.length-2] + "/" + arr[arr.length-1];
    } else {
        return url;
    }

} );
const fbxLoader: FBXLoader = new FBXLoader(loadingManager)

let character:THREE.Group;

fbxLoader.load(
    'models/chars/model_test.fbx',
    (object) => {
        character = object;
        object.scale.set(0.01, 0.01, 0.01)
        mixer = new THREE.AnimationMixer(object)

        const animationAction = mixer.clipAction(
            (object as THREE.Object3D).animations[0]
        )
        animationActions.push(animationAction)
        animationsFolder.add(animations, 'default')
        activeAction = animationActions[0]

        scene.add(object)
        
        // add an animation from another file
        fbxLoader.load('models/chars/anim_walk.fbx',
            (object) => {
                console.log("loaded walk")

                const animationAction = mixer.clipAction((object as THREE.Object3D).animations[0]);
                animationActions.push(animationAction)
                animationsFolder.add(animations, "walk")

                // add an animation from another file
                fbxLoader.load('models/chars/anim_talk.fbx',
                    (object) => {
                        console.log("loaded talk")
                        const animationAction = mixer.clipAction((object as THREE.Object3D).animations[0]);
                        animationActions.push(animationAction)
                        animationsFolder.add(animations, "talk")


                        // add an animation from another file
                        fbxLoader.load('models/chars/anim_idle.fbx',
                            (object) => {
                                console.log("loaded idle")
                                const animationAction = mixer.clipAction((object as THREE.Object3D).animations[0]);
                                animationActions.push(animationAction)
                                animationsFolder.add(animations, "idle")
                                modelReady = true

                            },
                            (xhr) => {
                                console.log((xhr.loaded / xhr.total * 100) + '% loaded')
                            },
                            (error) => {
                                console.log(error)
                            }
                        )

                    },
                    (xhr) => {
                        console.log((xhr.loaded / xhr.total * 100) + '% loaded')
                    },
                    (error) => {
                        console.log(error)
                    }
                )
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded')
            },
            (error) => {
                console.log(error)
            }
        )
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
        console.log(error)
    }
)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const stats = new Stats()
document.body.appendChild(stats.dom)

const animations = {
    default: function () {
        setAction(animationActions[0])
    },
    walk: function () {
        setAction(animationActions[1])
    },
    talk: function () {
        setAction(animationActions[2])
    },
    idle: function () {
        setAction(animationActions[3])
    },
}

const setAction = (toAction: THREE.AnimationAction) => {
    if (toAction != activeAction) {
        lastAction = activeAction
        activeAction = toAction
        lastAction.stop()
        //lastAction.fadeOut(1)
        activeAction.reset()
        //activeAction.fadeIn(1)
        activeAction.play()
    }
}

const gui = new GUI()
const animationsFolder = gui.addFolder('Animations')
animationsFolder.open()

const clock = new THREE.Clock()

function animate() {
    requestAnimationFrame(animate)

    controls.update()

    if (modelReady) {
        mixer.update(clock.getDelta())

        let movement = new THREE.Vector3();
        // if (character.position.z <= 100) {
        //     movement.z = 0.01;
        // }

        character.position.addVectors(character.position, movement);
        camera.position.addVectors(camera.position, movement);

        controls.target.set(character.position.x, character.position.y + 1, character.position.z)
    }

    render()

    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()