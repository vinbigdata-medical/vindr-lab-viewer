<img src="./platform/viewer/public/assets/vinlab/vindr_lab_logo.png" width="256"/>

# VinDr Lab / Viewer
The Vindr Lab Viewer is for viewing medical images. It can retrieve and load images from most sources and formats; render sets in 2D, 3D, and reconstructed representations; allows for the manipulation, annotation, and serialization of observations; supports internationalization, hotkeys, and many more features.

## Developing
The VindrLab project consists of two parts. So let's clone and run both projects together.
- [Vindr Lab Dashboard][vindr-lab-dashboard-url]: To manage Projects, Study list, Label, setting, Export label,...
- [Vindr Lab Viewer][vindr-lab-viewer-url]: For viewing medical images, labeling (bounding box, polygon, segment).

The Vindr Lab Viewer base on [OHIF][ohif-url] project. For more detail about configure, please read the [documentation][ohif-documents-url].

### Requirements

- [Yarn 1.17.3+](https://yarnpkg.com/en/docs/install)
- [Node 10+](https://nodejs.org/en/)
- Yarn Workspaces should be enabled on your machine:
  - `yarn config set workspaces-experimental true`

### Getting Started

1. [Fork this repository][how-to-fork]
2. [Clone your forked repository][how-to-clone]
   - `git clone https://github.com/YOUR-USERNAME/vindr-lab-viewer.git`
3. Navigate to the cloned project's directory
4. Add this repo as a `remote` named `upstream`
   - `git remote add upstream https://github.com/vinbigdata-medical/vindr-lab-viewer.git`
5. `yarn install` to restore dependencies and link projects
6. `yarn start` to run project.

Note: This project will be opened from the [vindr-lab-dashboard][vindr-lab-dashboard-url] project. So, let's clone and run it before running this project.

#### To Develop

_From this repository's root directory:_

```bash
# Enable Yarn Workspaces
yarn config set workspaces-experimental true

# Restore dependencies
yarn install
```

## Commands

These commands are available from the root directory. Each project directory
also supports a number of commands that can be found in their respective
`README.md` and `project.json` files.

| Yarn Commands                | Description                                                   |
| ---------------------------- | ------------------------------------------------------------- |
| **Develop**                  |                                                               |
| `dev` or `start`             | Default development experience for Viewer                     |
| `dev:project <package-name>` | Replace with `core`, `ui`, `i18n`, `cornerstone`, etc. |
| `test:unit`                  | Jest multi-project test runner; overall coverage              |
| **Deploy**                   |                                                               |
| `build`\*                    | Builds production output for our PWA Viewer                   |
| `build:package`\*            | Builds production `commonjs` output for our Viewer            |
| `build:package-all`\*        | Builds commonjs bundles for all projects                      |


## Projects

The  Medical Image Viewing Platform is maintained as a [`monorepo`][monorepo].
This means that this repository, instead of containing a single project, contains many projects.
If you explore our project structure, you'll see the following:

```bash
.
├── extensions              #
│   ├── _example            # Skeleton of example extension
│   ├── cornerstone         # 2D images w/ Cornerstone.js
│   ├── dicom-html          # Structured Reports as HTML in viewport
│   ├── dicom-microscopy    # Whole slide microscopy viewing
│   ├── dicom-pdf           # View DICOM wrapped PDFs in viewport
│   └── vtk                 # 2D MPR
│
├── platform                #
│   ├── core                # Business Logic
│   ├── i18n                # Internationalization Support
│   ├── ui                  # React component library
│   └── viewer              # Connects platform and extension projects
│
├── ...                     # misc. shared configuration
├── lerna.json              # MonoRepo (Lerna) settings
├── package.json            # Shared devDependencies and commands
└── README.md               # This file
```

### Platform

These projects comprise the

| Name                            | Description                                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [@ohif/core][platform-core]     | Business logic and classes that model the data, services, and extensions that are framework agnostic |
| [@ohif/i18n][platform-i18n]     | Language files and small API for wrapping component/ui text for translations                         |
| [@ohif/viewer][platform-viewer] | The Vindr Lab Viewer. Where we consume and configure all platform library's and extensions              |
| [@ohif/ui][platform-ui]         | Reusable React components we consume and compose to build our Viewer's UI                            |

### Extensions

| Name                                                           | Description                                             |
| -------------------------------------------------------------- | ------------------------------------------------------- |
| [@ohif/extension-cornestone][extension-cornerstone]            | 2D image viewing, annotation, and segementation tools   |
| [@ohif/extension-dicom-html][extension-dicom-html]             | Support for viewing DICOM SR as rendered HTML           |
| [@ohif/extension-dicom-microscopy][extension-dicom-microscopy] | Whole slide microscopy viewing                          |
| [@ohif/extension-dicom-pdf][extension-dicom-pdf]               | View DICOM wrapped PDFs in a viewport                   |
| [@ohif/extension-vtk][extension-vtk]                           | 2D MPR                                                  |


## Acknowledgement

**Note:** If you use or find this repository helpful, please take the time to star this repository on Github. This is an easy way for us to assess adoption and it can help us obtain future funding for the project.

This work is supported primarily by [Vingroup Big Data Institute](http://vinbigdata.org/)
## License

[MIT License](https://github.com/vinbigdata-medical/vinlab-sites/blob/master/LICENSE)


<!--
  Links
  -->

<!-- prettier-ignore-start -->
<!-- Links -->
[ohif-url]: https://github.com/OHIF/Viewers
[ohif-documents-url]: https://docs.ohif.org/
[vindr-lab-dashboard-url]: https://github.com/vinbigdata-medical/vindr-lab-dashboard
[vindr-lab-viewer-url]: https://github.com/vinbigdata-medical/vindr-lab-viewer
[monorepo]: https://en.wikipedia.org/wiki/Monorepo
[how-to-fork]: https://help.github.com/en/articles/fork-a-repo
[how-to-clone]: https://help.github.com/en/articles/fork-a-repo#step-2-create-a-local-clone-of-your-fork
<!-- Platform -->
[platform-core]: platform/core/README.md
[platform-i18n]: platform/i18n/README.md
[platform-ui]: platform/ui/README.md
[platform-viewer]: platform/viewer/README.md
<!-- Extensions -->
[extension-cornerstone]: extensions/cornerstone/README.md
[extension-dicom-html]: extensions/dicom-html/README.md
[extension-dicom-microscopy]: extensions/dicom-microscopy/README.md
[extension-dicom-pdf]: extensions/dicom-pdf/README.md
[extension-vtk]: extensions/vtk/README.md
<!-- prettier-ignore-end -->
