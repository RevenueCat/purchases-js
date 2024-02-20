fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

### bump

```sh
[bundle exec] fastlane bump
```

Replaces version numbers, updates changelog and creates PR

### automatic_bump

```sh
[bundle exec] fastlane automatic_bump
```

Automatically bumps version, replaces version numbers, updates changelog and creates PR

### github_release

```sh
[bundle exec] fastlane github_release
```

Creates github release

### release

```sh
[bundle exec] fastlane release
```

Creates GitHub release and publishes react-native-purchases and react-native-purchases-ui

### generate_docs

```sh
[bundle exec] fastlane generate_docs
```

Generate docs

### tag_current_branch

```sh
[bundle exec] fastlane tag_current_branch
```

Tag current branch with current version number

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
