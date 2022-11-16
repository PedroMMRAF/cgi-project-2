precision highp float;

uniform vec4 uLightPos;
uniform mat4 mModelView;
uniform mat4 mProjection;

uniform vec3 uColor;

varying vec3 fPosition;
varying vec3 fNormal;

void main() {
    vec3 lightDist = normalize(vec3(uLightPos) - fPosition);
    vec3 normal = normalize(fNormal);

    float diffuse = dot(normal, lightDist);
    diffuse = clamp(diffuse, 0.2, 1.0);

    gl_FragColor = vec4((uColor / 255.0) * diffuse, 1.0);
}
