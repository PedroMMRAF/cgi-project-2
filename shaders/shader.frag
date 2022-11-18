precision highp float;

uniform vec4 uLightDir;

uniform vec3 uColor;
varying vec3 fNormal;

void main() {
    vec3 lightDir = normalize(vec3(uLightDir));
    vec3 normal = normalize(fNormal);

    float diffuse = dot(normal, lightDir);
    diffuse = clamp(diffuse, 0.2, 1.0);

    gl_FragColor = vec4(uColor * diffuse, 1.0);
}
