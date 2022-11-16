precision highp float;

uniform vec4 uLightPos;
uniform mat4 mModelView;
uniform mat4 mProjection;

uniform vec3 uColor;

varying vec3 fPosition;
varying vec3 fNormal;

void main() {
    vec3 lightDist = vec3(uLightPos) - fPosition;
    vec3 normal = normalize(fNormal);

    float diffuse = dot(normal, normalize(lightDist));
    float dist = length(lightDist);
    diffuse = clamp(diffuse, 0.2, 1.0);
    diffuse /= 1.0 + 0.00001 * dist + 0.0000001 * dist * dist;

    gl_FragColor = vec4(uColor * diffuse, 1.0);
}
