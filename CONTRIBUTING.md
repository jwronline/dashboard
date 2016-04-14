# Contributing

Thanks for wanting to help with this projects, there are loads of things to be improved on this project.

If you have questions, contact [Haroen Viaene](https://haroen.me) via any way you want to.

## Help needed

* test older/explicit browsers
* let all problems know
* fix open issues
* write steps and cut video for everything starting from `orbit`

## Organisation

The whole site can be both run in a regular browser by Jekyll, and for example the different `steps` of the mission are put inside the `_data/steps.yml`. Don't hesitate to contact if you've got questions, there are loads of things to do for which you don't need to know how to code.

## How does it work?

This project is made with a mixture of Jekyll and Electron. To have a local version of this project, first make sure you've got `ruby` and `node` installed. The next step is to make sure you've got Jekyll by doing `bundle install`. Then you can run `jekyll build` and open `index.html` in the `_site`-folder. To view the application you have to run `npm install` and `npm start`. To build a version of the application that runs standalone you can run `npm build`, which will create Windows, Mac and Linux versions of the project. In case you for example just want the Windows version, you'll manually have to run `node node_modules/electron-packager/cli.js _site --platform=win32 --arch=x64 --overwrite`.

