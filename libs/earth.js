const app = document.querySelector(".app");

// 初始化场景
const scene = new THREE.Scene();

// 初始化透视相机
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  1,
  1000
);
camera.position.set(1.25, 7, 17);
camera.lookAt(scene.position);

// 初始化 WebGL 渲染器
// antialias 抗锯齿
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
// 背景色
renderer.setClearColor(0x292929);
// 渲染器大小
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

// 初始化轨道控制器
const controls = new THREE.OrbitControls(camera, renderer.domElement);
// 阻尼（惯性）
controls.enableDamping = true;
// 阻尼系数
controls.dampingFactor = 0.88;
// 相机位置的平移方式
controls.screenSpacePanning = false;
// 相机平移
controls.enablePan = false;
// 相机缩放
controls.enableZoom = false;

// 创建一个半径为 5 ，水平垂直段数为400的球体
const geom = new THREE.SphereBufferGeometry(8, 400, 400);

// 加载纹理文件
const loader = new THREE.TextureLoader();
const texture = loader.load("./assets/earth.jpg");
// 纹理无限重复
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(1, 1);

const disk = loader.load("./assets/dot.png");

/**
 * @param {*} size 点的大小
 * @param {*} reverse 是否反转纹理颜色
 */
const createPoint = ({size, reverse}) => new THREE.Points(
  geom,
  new THREE.ShaderMaterial({
    vertexColors: THREE.VertexColors,
    uniforms: {
      visibility: {
        value: texture,
      },
      shift: {
        value: 0,
      },
      shape: {
        value: disk,
      },
      size: {
        value: size,
      },
      scale: {
        value: window.innerHeight / 2,
      },
    },
    vertexShader: `
  				
      uniform float scale;
      uniform float size;
      
      varying vec2 vUv;
      varying vec3 vColor;
      
      void main() {
      
        vUv = uv;
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_PointSize = size * ( scale / length( mvPosition.xyz ) );
        gl_Position = projectionMatrix * mvPosition;

      }
  `,
    fragmentShader: `
      uniform sampler2D visibility;
      uniform float shift;
      uniform sampler2D shape;
      
      varying vec2 vUv;
      varying vec3 vColor;
      

      void main() {
      	
        vec2 uv = vUv;
        uv.x += shift;
        vec4 v = texture2D(visibility, uv);
        if (length(v.rgb) ${reverse ? '<' : '>'} 1.0) discard;

        gl_FragColor = vec4( vColor, 1.0 );
        vec4 shapeData = texture2D( shape, gl_PointCoord );
        if (shapeData.a < 0.5) discard;
        gl_FragColor = gl_FragColor * shapeData;
		
      }
  `,
    transparent: true,
  })
);

// 地图上的陆地
const points = createPoint({size: 0.08});
scene.add(points);

// 地图上的海洋
const reverse_point = createPoint({size: 0.04, reverse: true});
scene.add(reverse_point);

// 内部纯色背景
const bgGlobe = new THREE.Mesh(
  geom,
  new THREE.MeshBasicMaterial({
    color: 0x292929,
  })
);
bgGlobe.scale.setScalar(0.99);
scene.add(bgGlobe);

const render = () => {
  // 地球自转
  scene.rotation.y += 0.001;
  renderer.render(scene, camera);
}

const run = () => {
  requestAnimationFrame(run);
  controls.update();
  render();
}

run();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, false);
