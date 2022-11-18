uniform mat4 mInvModelView;
uniform mat4 mModelView;
uniform mat4 mProjection;

attribute vec3 vPosition;
attribute vec3 vNormal;

varying vec3 fNormal;

void main() {
    fNormal = mat3(mInvModelView) * vNormal;

    gl_Position = mProjection * mModelView * vec4(vPosition, 1.0);
}
