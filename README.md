# GithubOrgRepoList
This Node.js package saves in a file the list of repositories of a Github Organisation filtered by a property and an OR regex condition

## Requirements

* Node.js
* Nothing else :P


## Usage
```Shell
$ npm run start <YOUR_GITHUB_ACCESS_TOKEN> <ORGANISATION_NAME> <GITHUB_PROPERTY_NAME> <OUTPUT_FILE_PATH> <LIST_OF_REGEX_TO_FILTER_BY>
```
## Examples

Command:
```Shell
$ npm run start <YOUR_GITHUB_ACCESS_TOKEN> Google name result.txt toolkit-.*-client
```

Output at ```result.txt```:

```
identity-toolkit-go-client
identity-toolkit-java-client
identity-toolkit-node-client
identity-toolkit-php-client
```

#### Another example:

Command:
```Shell
$ npm run start <YOUR_GITHUB_ACCESS_TOKEN> Google name result.txt python android angular
```

Output at ```result.txt```:

```
android-arscblamer
android-classyshark
android-cuttlefish
android-emulator-container-scripts
android-emulator-hypervisor-driver-for-amd-processors
android-gradle-dsl
android-kerberos-authenticator
android-key-attestation
android-lint-performance-probe
android-management-api-samples
android-studio-check
android-uiconductor
android-wear-stitch-script
angular_cli
angular_node_bind.dart
angular-a11y-workshop
angular-sticky-element
blockly-android
chatbase-python
cloud-cup-android
coursebuilder-android-container-module
cpython-pt
deputy-api-python-client
favcolor-android
gae-secure-scaffold-python
gdata-python-client
google-authenticator-android
google-reauth-python
google-visualization-python
googletv-android-samples
ground-android
identity-toolkit-python-client
music-synthesizer-for-android
picview-for-android
python_portpicker
python-adb
python-atfork
python-cloud-utils
python-fanotify
python-fire
python-gflags
python-lakeside
python-laurel
python-spanner-orm
python-subprocess32
python-temescal
python-yaml-config
santa-tracker-android
yara-procdump-python
```

## References

See all Github Repositories properties available from Github API at https://developer.github.com/v3/repos/#response


## License

MIT

## Credits

Rafael Pernil Bronchalo (@rafaelpernil2) - Developer

