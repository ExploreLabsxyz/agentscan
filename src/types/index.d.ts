/// <reference types="react" />
/// <reference types="node" />

declare module '*.svg' {
  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}
