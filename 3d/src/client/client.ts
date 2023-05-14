import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

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
camera.position.set(0, 1.65, 1.5)

let targetPoints = [[0,0,0]];

let geometry = new THREE.BoxGeometry( 1, 1, 1 ); 
let material = new THREE.MeshStandardMaterial( {
    color: 0xc31313,
    roughness: 1,
    metalness: 0.8,

} ); 
let cube = new THREE.Mesh( geometry, material );
cube.position.set(5,0.5,-5); // червоний куб
targetPoints.push([5,0,-4]);
scene.add( cube );

geometry = new THREE.BoxGeometry( 1, 1, 1 ); 
material = new THREE.MeshStandardMaterial( {
    color: 0x24d917,
    roughness: 1,
    metalness: 0.8,

} ); 
cube = new THREE.Mesh( geometry, material );
cube.position.set(0,0.5,-5); // зелений куб
targetPoints.push([0,0,-4]);
scene.add( cube );

let geometry2 = new THREE.SphereGeometry( 0.5, 64, 64 ); 
material = new THREE.MeshStandardMaterial( {
    color: 0xffff18, 
    roughness: 1,
    metalness: 0.8,

} ); 
let sphere = new THREE.Mesh( geometry2, material );
sphere.position.set(-4,0.5,4); //жовта сфера
targetPoints.push([-4,0,3]);
scene.add( sphere );

geometry2 = new THREE.SphereGeometry( 0.5, 64, 64 ); 
material = new THREE.MeshStandardMaterial( {
    color: 0x1818d8, 
    roughness: 1,
    metalness: 0.8,

} ); 
sphere = new THREE.Mesh( geometry2, material );
sphere.position.set(4,0.5,0); //синя сфера
targetPoints.push([3,0,0]);
scene.add( sphere );

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
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
        activeAction = animationActions[0]

        scene.add(object)
        
        // add an animation from another file
        fbxLoader.load('models/chars/anim_walk.fbx',
            (object) => {
                console.log("loaded walk")

                const animationAction = mixer.clipAction((object as THREE.Object3D).animations[0]);
                animationActions.push(animationAction)

                // add an animation from another file
                fbxLoader.load('models/chars/anim_talk.fbx',
                    (object) => {
                        console.log("loaded talk")
                        const animationAction = mixer.clipAction((object as THREE.Object3D).animations[0]);
                        animationActions.push(animationAction)


                        // add an animation from another file
                        fbxLoader.load('models/chars/anim_idle.fbx',
                            (object) => {
                                console.log("loaded idle")
                                const animationAction = mixer.clipAction((object as THREE.Object3D).animations[0]);
                                animationActions.push(animationAction)
                                modelReady = true
                                animations.idle();
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

eval("window.runAnimation = animations");

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

const clock = new THREE.Clock()

let going = false;
let currentPoint = 0;
let targetPoint = 0;
async function goToPoint(point:number) {
    if (point == currentPoint) {
        return true;
    }
    targetPoint = point;
    animations.walk();
    while (targetPoint != currentPoint) {
        await new Promise(r => setTimeout(r, 200));
    }
    animations.idle();
    character.lookAt(camera.position.x, 0, camera.position.z);
    return true;
}

eval("window.goToPoint = goToPoint");

function animate() {
    requestAnimationFrame(animate)

    controls.update()

    if (modelReady) {
        mixer.update(clock.getDelta())

        let xDone = false;
        let yDone = false;

        let movement = new THREE.Vector3();
        if (targetPoint != currentPoint) {
            if (Math.abs(targetPoints[targetPoint][0] - character.position.x) <= 0.01) {
                xDone = true;
                movement.x = targetPoints[targetPoint][0] - character.position.x;
            } else if (targetPoints[targetPoint][0] > character.position.x) {
                movement.x = 0.01;
            } else if (targetPoints[targetPoint][0] < character.position.x) {
                movement.x = -0.01;
            }
            if (Math.abs(targetPoints[targetPoint][2] - character.position.z) <= 0.01) {
                yDone = true;
                movement.z = targetPoints[targetPoint][2] - character.position.z;
            } else if (targetPoints[targetPoint][2] > character.position.z) {
                movement.z = 0.01;
            } else if (targetPoints[targetPoint][2] < character.position.z) {
                movement.z = -0.01;
            }
            if (xDone && yDone) {
                currentPoint = targetPoint;
            }
            character.lookAt((new THREE.Vector3()).addVectors(character.position, movement));
        }

        character.position.addVectors(character.position, movement);
        camera.position.addVectors(camera.position, movement);

        controls.target.set(character.position.x, character.position.y + 1, character.position.z)
    }

    render()
}

function render() {
    renderer.render(scene, camera)
}

animate()