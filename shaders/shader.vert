uniform mat4 mModelView;
uniform mat4 mProjection;

attribute vec3 vPosition;
attribute vec3 vNormal;

varying vec3 fPosition;
varying vec3 fNormal;

void main() {
    fPosition = vec3(mModelView * vec4(vPosition, 1.0));
    fNormal = vec3(mModelView * vec4(vNormal, 0.0));

    gl_Position = mProjection * mModelView * vec4(vPosition, 1.0);
}
