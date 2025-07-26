export type ImportMap = {
  path: string;
  content: string;
};

export type DependencyConfig = {
  /** Name of dependency */
  name: string;
  /** Whether to minify the code. */
  minify?: boolean;
  /** Externals to leave as requires of the build. */
  externals?: Record<string, string>;
  /** Only bundle the dts files */
  dtsOnly?: boolean;
  /** Externals types */
  dtsExternals?: Array<string | RegExp>;
  /** Whether to prettier the code and strip comments */
  prettier?: boolean;
  /** Emit extra entry files to map imports. */
  emitFiles?: ImportMap[];
  /** Copy extra fields from original package.json to target package.json. */
  packageJsonField?: string[];
  /** Whether to ignore type definitions */
  ignoreDts?: boolean;
  /** Whether to copy all type definitions files rather than bundle them */
  copyDts?: boolean;
  /** Target ECMA version */
  target?: string;
  /* Callback before bundle. */
  beforeBundle?: (task: ParsedTask) => void | Promise<void>;
  /* Callback after bundle. */
  afterBundle?: (task: ParsedTask) => void | Promise<void>;
};

export type Config = {
  /**
   * Configure externals for all packages,
   * will be merged with dependencies[i].externals.
   */
  externals?: Record<string, string>;
  dependencies: Array<string | DependencyConfig>;
  /** Whether to prettier the code and strip comments */
  prettier?: boolean;
};

export type ParsedTask = {
  depPath: string;
  depEntry: string;
  distPath: string;
  importPath: string;
  ignoreDts?: boolean;
  dtsOnly?: boolean;
  copyDts?: boolean;
  prettier?: boolean;
  target: NonNullable<DependencyConfig['target']>;
  minify: NonNullable<DependencyConfig['minify']>;
  depName: NonNullable<DependencyConfig['name']>;
  externals: NonNullable<DependencyConfig['externals']>;
  dtsExternals: NonNullable<DependencyConfig['dtsExternals']>;
  emitFiles: NonNullable<DependencyConfig['emitFiles']>;
  afterBundle?: NonNullable<DependencyConfig['afterBundle']>;
  beforeBundle?: NonNullable<DependencyConfig['beforeBundle']>;
  packageJsonField: NonNullable<DependencyConfig['packageJsonField']>;
};
