# Changelog

## [0.1.2-rc.2](https://github.com/MapColonies/jobnik-manager-test/compare/v0.1.2-rc.1...v0.1.2-rc.2) (2026-02-01)


### Miscellaneous Chores

* enforce correct rc version ([294470c](https://github.com/MapColonies/jobnik-manager-test/commit/294470c4b7e5a4dd72df110c1a33547a411948ec))

## [0.1.2-rc.1](https://github.com/MapColonies/jobnik-manager-test/compare/v0.1.2-rc.1...v0.1.2-rc.1) (2026-02-01)


### ⚠ BREAKING CHANGES

* clean python
* change the python
* : trigger CI 19
* test

### Features

* add comprehensive error handling from OpenAPI spec (MAPCO-7927) ([#89](https://github.com/MapColonies/jobnik-manager-test/issues/89)) ([225789d](https://github.com/MapColonies/jobnik-manager-test/commit/225789d6f16a96df96d7a92fe07a055557aad0e2))
* add cron job functionality for task cleanup (MAPCO-8350) ([#94](https://github.com/MapColonies/jobnik-manager-test/issues/94)) ([8de6cca](https://github.com/MapColonies/jobnik-manager-test/commit/8de6cca114ca076470663b10be037f95c43df02c))
* add isWaiting flag to stage creation for conditional status handling (MAPCO-7905) ([#40](https://github.com/MapColonies/jobnik-manager-test/issues/40)) ([e92d6a0](https://github.com/MapColonies/jobnik-manager-test/commit/e92d6a0efb8bb1127d1f473f2e0e3b05c04af218))
* add metrics for tracking in-progress jobs, stages, and tasks MAPCO-8206 ([#119](https://github.com/MapColonies/jobnik-manager-test/issues/119)) ([4105597](https://github.com/MapColonies/jobnik-manager-test/commit/4105597bfa229a7d233fe780a2a060de374466a8))
* add order field to stages for maintaining execution sequence and update related logic (MAPCO-7897) ([#72](https://github.com/MapColonies/jobnik-manager-test/issues/72)) ([1667e27](https://github.com/MapColonies/jobnik-manager-test/commit/1667e27a73c0512884cbf5be831069544b059936))
* add Prisma instrumentation for enhanced tracing and update related logic ([#76](https://github.com/MapColonies/jobnik-manager-test/issues/76)) ([b35aff9](https://github.com/MapColonies/jobnik-manager-test/commit/b35aff9c55963c770478091c7a8c8f2d97ee63de))
* add Python setup step for smart release action ([933a34d](https://github.com/MapColonies/jobnik-manager-test/commit/933a34d80c04b08c7dde77b770b61412e67410e1))
* add startTime and endTime fields to task model (MAPCO-8349) ([#93](https://github.com/MapColonies/jobnik-manager-test/issues/93)) ([2c17e42](https://github.com/MapColonies/jobnik-manager-test/commit/2c17e426aec4c9c56730d8985d7c4710a3846014))
* add userMetadata, creationTime, and updateTime to task and stage schemas as mandatory MAPCO-8576 ([#170](https://github.com/MapColonies/jobnik-manager-test/issues/170)) ([f26268e](https://github.com/MapColonies/jobnik-manager-test/commit/f26268e68d0196aff546a6c2dc0aa2507f4d2627))
* enhance job, stage and task status update descriptions and validations in OpenAPI spec  MAPCO-8783 ([#171](https://github.com/MapColonies/jobnik-manager-test/issues/171)) ([bd1c50b](https://github.com/MapColonies/jobnik-manager-test/commit/bd1c50bebc4a654a7d2b855ac6dea547e397c968))
* enhance tracing attributes in job, stage and task managers  MAPCO-8341 ([#169](https://github.com/MapColonies/jobnik-manager-test/issues/169)) ([3107027](https://github.com/MapColonies/jobnik-manager-test/commit/3107027db577bc277225e95d47c6247d6b4fc23a))
* enhance tracing support with traceparent and tracestate fields in jobs, stages, and tasks (MAPCO-8340) ([#78](https://github.com/MapColonies/jobnik-manager-test/issues/78)) ([b1c78f5](https://github.com/MapColonies/jobnik-manager-test/commit/b1c78f5ca15a2731d1554d9037241fddbc6190b4))
* implement automatic status propagation across job-stage-task hierarchy MAPCO-8785  MAPCO-8784 ([#153](https://github.com/MapColonies/jobnik-manager-test/issues/153)) ([7f80168](https://github.com/MapColonies/jobnik-manager-test/commit/7f8016811d65adeaa75f2491ca5c0a51b55a6fd2))
* implement stage status transition validation and update logic (MAPCO-8803) ([#146](https://github.com/MapColonies/jobnik-manager-test/issues/146)) ([1201f90](https://github.com/MapColonies/jobnik-manager-test/commit/1201f90dd0f7d6c6ec3bd738f2520583afcf70d0))
* integrate jobnik manager with config manager & schemas (MAPCO-7924) ([#116](https://github.com/MapColonies/jobnik-manager-test/issues/116)) ([4c3e716](https://github.com/MapColonies/jobnik-manager-test/commit/4c3e716a12edf020c6c8f6982d514cd46fee9a42))
* introduce v1 API structure with jobs, stages, and tasks endpoints MAPCO-8959 ([#205](https://github.com/MapColonies/jobnik-manager-test/issues/205)) ([dad0bd3](https://github.com/MapColonies/jobnik-manager-test/commit/dad0bd3b7844346dad9754ed77ec2af42728890a))
* Jobnik Manager: project skeleton & core functions ([#34](https://github.com/MapColonies/jobnik-manager-test/issues/34)) ([099bc8d](https://github.com/MapColonies/jobnik-manager-test/commit/099bc8d12c81b18f1d8f76d7658b23bed561e976))
* **next:** add workflow for pushing next artifacts to Azure Registry ([a61298d](https://github.com/MapColonies/jobnik-manager-test/commit/a61298dbab7e1348990b9afc18a9a21232ab1641))
* test ([99bad03](https://github.com/MapColonies/jobnik-manager-test/commit/99bad035dbe666efb0860b08784043ad073e4c4c))
* trigger CI 11 ([be875ac](https://github.com/MapColonies/jobnik-manager-test/commit/be875acf860f876dcdd4b1e0adda3d4b2217ecd0))
* trigger CI 17 ([d8ec075](https://github.com/MapColonies/jobnik-manager-test/commit/d8ec075e80c84ea8184ee7c3bb4409b31f082139))


### Bug Fixes

* 1 ([f0c42a2](https://github.com/MapColonies/jobnik-manager-test/commit/f0c42a26e007ca6dfa09f41dd06e0ae7914d322e))
* 2 ([d5ccfa5](https://github.com/MapColonies/jobnik-manager-test/commit/d5ccfa532346bcdf8b9eb44fc992ce7b36791cd1))
* clean python ([db24286](https://github.com/MapColonies/jobnik-manager-test/commit/db2428603c5010672059069f0a9afe75384eb236))
* include first-parent in commit depth log command ([40e6201](https://github.com/MapColonies/jobnik-manager-test/commit/40e6201cde0d2fd3cb604602b4b5201b2d3101eb))
* remove unused previewFeatures from prisma client generator ([2159346](https://github.com/MapColonies/jobnik-manager-test/commit/2159346088de43d409472bcd018f115245798e43))
* restore ([92956e0](https://github.com/MapColonies/jobnik-manager-test/commit/92956e0ef7f7c5387eba3fb93db5b1385a00e012))
* **smart-release-please:** enhance version management for RC and stable releases ([253bd71](https://github.com/MapColonies/jobnik-manager-test/commit/253bd7125699006f5a6aeb18b840e086fd5879dd))
* test ([e891eca](https://github.com/MapColonies/jobnik-manager-test/commit/e891eca784c877d27e8bd72ea906626ac19091a9))
* test ([78d37c3](https://github.com/MapColonies/jobnik-manager-test/commit/78d37c33c51bccecacfab4ad986d904d30eb8663))
* test 1 ([e4dcd6f](https://github.com/MapColonies/jobnik-manager-test/commit/e4dcd6f777c4f824a1e10b7bc464d8a34b464c6d))
* test 1 ([8e5201b](https://github.com/MapColonies/jobnik-manager-test/commit/8e5201b9da0147e2937c8692684a66091f29c9d9))
* test 2 ([ef8f1fe](https://github.com/MapColonies/jobnik-manager-test/commit/ef8f1fe9e32c4bbb81a833e1dc1f380f1f46413b))
* test 2 ([e11a0c1](https://github.com/MapColonies/jobnik-manager-test/commit/e11a0c193f5ffa2b5f750077bc68ca5ec2aa36d8))
* test fix ([7e6bb5f](https://github.com/MapColonies/jobnik-manager-test/commit/7e6bb5fcdd6622f79ad4c3d779aeaf2ecd2f2e64))
* test2 ([c14aaa8](https://github.com/MapColonies/jobnik-manager-test/commit/c14aaa88c3088368a921359aca3e6dfc52d246d0))
* trigger CI ([1f4a38a](https://github.com/MapColonies/jobnik-manager-test/commit/1f4a38aae563bacfbfbec0fdaf97c86023c00bb1))
* trigger CI ([0658d10](https://github.com/MapColonies/jobnik-manager-test/commit/0658d10d869d3fac5c7908b619901d2748cdfc66))
* trigger CI ([2490b3d](https://github.com/MapColonies/jobnik-manager-test/commit/2490b3d05980b7de467e2ed4f5cc771d498abb99))
* trigger CI ([a162884](https://github.com/MapColonies/jobnik-manager-test/commit/a162884af9d6f986bf1384e27eadb32fea9bdbf3))
* trigger CI ([96ad1bf](https://github.com/MapColonies/jobnik-manager-test/commit/96ad1bf924a6f24c092e57d245b6367d211d6b9a))
* trigger CI ([3f96e7a](https://github.com/MapColonies/jobnik-manager-test/commit/3f96e7aae979721cff1a181f9d1d17a87e672929))
* trigger CI ([9830c83](https://github.com/MapColonies/jobnik-manager-test/commit/9830c83c62a52ce45fc1e2882ddae37cd4f777d7))
* trigger CI ([6652073](https://github.com/MapColonies/jobnik-manager-test/commit/6652073ca3aa0d6f690d25ac860cc0c2dd9f8ba5))
* trigger CI 11 ([0ceaab7](https://github.com/MapColonies/jobnik-manager-test/commit/0ceaab769f5676e5303e42d22b515b88bb5e462b))
* trigger CI 2 ([6ef0224](https://github.com/MapColonies/jobnik-manager-test/commit/6ef0224f581eb7be411f2b5f63f3ea250685bb01))
* trigger CI 2 ([b5ab86c](https://github.com/MapColonies/jobnik-manager-test/commit/b5ab86ca15106f91faa000dfd24a3975ae4fd3b8))
* trigger rc ([a408c78](https://github.com/MapColonies/jobnik-manager-test/commit/a408c780eec5cbd1fcf478cbba72de7cbc079772))
* trigger rc ([74047f1](https://github.com/MapColonies/jobnik-manager-test/commit/74047f19bf89307831bd0e2f4bcc9a7962efc08d))
* trigger rc ([f71b21d](https://github.com/MapColonies/jobnik-manager-test/commit/f71b21d887f76188eaa8a13c8d37fec2566c80f4))


### Miscellaneous Chores

* enforce correct rc version ([0d4890b](https://github.com/MapColonies/jobnik-manager-test/commit/0d4890bd74b622b33ed902f2173a26842ac90b40))
* enforce correct rc version ([3a2bb8b](https://github.com/MapColonies/jobnik-manager-test/commit/3a2bb8b7a128cad627bd6e6e2ac6934fecaae4d5))
* enforce correct rc version ([4b372f2](https://github.com/MapColonies/jobnik-manager-test/commit/4b372f2979be8ca9cffbfcefb8cbea2b7ae90558))
* enforce correct rc version ([080a3b0](https://github.com/MapColonies/jobnik-manager-test/commit/080a3b0598b9e4b7756cb7f3248ccf4318ae7989))
* enforce correct rc version ([3681800](https://github.com/MapColonies/jobnik-manager-test/commit/3681800c52610e024e78c31da00d7aa1b519ec00))
* enforce correct rc version ([94bbab1](https://github.com/MapColonies/jobnik-manager-test/commit/94bbab19a11a7ff1ced79b4bf31acde3fe05500a))
* enforce correct rc version ([6ff5c81](https://github.com/MapColonies/jobnik-manager-test/commit/6ff5c81435fa6522cc1a995904ba2a7b1547c78f))
* enforce correct rc version ([ce99dd6](https://github.com/MapColonies/jobnik-manager-test/commit/ce99dd6ceba830f6bc1b80e84a811485219a7ecd))
* enforce correct rc version ([5611951](https://github.com/MapColonies/jobnik-manager-test/commit/56119517a8fd3fab2b69c5ecd35c5cfc6efd6b55))
* enforce correct rc version ([2e59db7](https://github.com/MapColonies/jobnik-manager-test/commit/2e59db74386bd82030607e831ff046c77b32506d))
* enforce correct rc version ([daeedeb](https://github.com/MapColonies/jobnik-manager-test/commit/daeedebdef91bef5b76d5157431913bc73b62afa))
* enforce correct rc version ([a98c129](https://github.com/MapColonies/jobnik-manager-test/commit/a98c1291489898c1d83124472e562c021c28c584))
* enforce correct rc version ([4e91033](https://github.com/MapColonies/jobnik-manager-test/commit/4e910336ef8a82a3b02fdb906cf9612f5f21acce))
* enforce correct rc version ([94a6c19](https://github.com/MapColonies/jobnik-manager-test/commit/94a6c19b49add6d414b5a9da5e7e563ba2c86c93))
* enforce correct rc version ([eb94f34](https://github.com/MapColonies/jobnik-manager-test/commit/eb94f3426ce3d1041e6a85f0c263bb7f3f743023))
* enforce correct rc version ([c9cb701](https://github.com/MapColonies/jobnik-manager-test/commit/c9cb701cb9ea9539b177c748f77981742d2b354c))
* enforce correct rc version ([7ccda96](https://github.com/MapColonies/jobnik-manager-test/commit/7ccda9653f2d4d204dffac083b49caeed64c7800))
* enforce correct rc version ([988d88b](https://github.com/MapColonies/jobnik-manager-test/commit/988d88bc827fd9b5b99e92c15622413b7c731d3d))
* enforce correct rc version ([0978b63](https://github.com/MapColonies/jobnik-manager-test/commit/0978b63a0252df10ede47f4ae6927ba4f7392260))
* enforce correct rc version ([769f4b3](https://github.com/MapColonies/jobnik-manager-test/commit/769f4b32fbdbef9558b2dadbff96e66a0cff5ac4))
* enforce correct rc version ([56235ce](https://github.com/MapColonies/jobnik-manager-test/commit/56235ce1d6f3c080d0070c3a6d3403535ebc64b7))
* enforce correct rc version ([abd9ccb](https://github.com/MapColonies/jobnik-manager-test/commit/abd9ccb48fa699744363e2b1f94cf882566f9d26))
* enforce correct rc version ([70dfb40](https://github.com/MapColonies/jobnik-manager-test/commit/70dfb40d98097e5371e1cf6608c01cf28c3c8d6a))
* enforce correct rc version ([60e6a32](https://github.com/MapColonies/jobnik-manager-test/commit/60e6a32b4735005a98cede55c042c5b50a7198d8))
* enforce correct rc version ([8e395b7](https://github.com/MapColonies/jobnik-manager-test/commit/8e395b7c3801ae60813f1816554d2de11cc30afc))
* enforce correct rc version ([128128c](https://github.com/MapColonies/jobnik-manager-test/commit/128128c2b6c805728e1ba935fb16e7ee6e0df8b2))
* enforce correct rc version ([00ce1d6](https://github.com/MapColonies/jobnik-manager-test/commit/00ce1d6d746ca66a798bf5b8574f428053e45bbb))
* enforce correct rc version ([4799343](https://github.com/MapColonies/jobnik-manager-test/commit/47993435ef0d751672de97e4f52aaecaeb6426f5))
* enforce correct rc version ([dd2b2dd](https://github.com/MapColonies/jobnik-manager-test/commit/dd2b2dd031c4e66c5cc3ddfc6711deaa264ae8a7))
* enforce correct rc version ([3e2d60c](https://github.com/MapColonies/jobnik-manager-test/commit/3e2d60ce79d79ce2e09dfea120de3a849c410544))
* enforce correct rc version ([235e037](https://github.com/MapColonies/jobnik-manager-test/commit/235e037f4f3172d919d1ee38309ed279c59a62d5))
* enforce correct rc version ([c4c04d1](https://github.com/MapColonies/jobnik-manager-test/commit/c4c04d10e0f7f966d5042ec4fdaef140d67180de))
* enforce correct rc version ([3f045bd](https://github.com/MapColonies/jobnik-manager-test/commit/3f045bdb92734472e5218e623a24c55e45b2d901))
* enforce correct rc version ([b06cd35](https://github.com/MapColonies/jobnik-manager-test/commit/b06cd3571993f2d8623f94ee1e1c4c354c8e2380))
* enforce correct rc version ([10f383f](https://github.com/MapColonies/jobnik-manager-test/commit/10f383f207b16fb54ed438853da5bda2a3989fe3))
* enforce correct rc version ([ae6468c](https://github.com/MapColonies/jobnik-manager-test/commit/ae6468c54a32b2185defe32333eccce47489bec8))
* enforce correct rc version ([e7031db](https://github.com/MapColonies/jobnik-manager-test/commit/e7031db1453018476514def40bb51e742e80abd7))
* enforce correct rc version ([73fc477](https://github.com/MapColonies/jobnik-manager-test/commit/73fc477670244c9c46868c2d3300b89a5047c443))


### Code Refactoring

* : trigger CI 19 ([1596791](https://github.com/MapColonies/jobnik-manager-test/commit/159679199c40ac813c2a34577d1c6d105fa528e9))
* change the python ([54bb995](https://github.com/MapColonies/jobnik-manager-test/commit/54bb995ab00840b635a3754ff693fdb418e7e45c))
* clean python ([1595795](https://github.com/MapColonies/jobnik-manager-test/commit/15957958ad7ebc5cb5732de44bdfa518de726900))

## [0.1.2-rc.1](https://github.com/MapColonies/jobnik-manager-test/compare/jobnik-manager-v0.2.0-rc.1...jobnik-manager-v0.1.2-rc.1) (2026-02-01)


### Miscellaneous Chores

* enforce correct rc version ([0d4890b](https://github.com/MapColonies/jobnik-manager-test/commit/0d4890bd74b622b33ed902f2173a26842ac90b40))

## [0.2.0-rc.1](https://github.com/MapColonies/jobnik-manager-test/compare/jobnik-manager-v0.1.1-rc.38...jobnik-manager-v0.2.0-rc.1) (2026-02-01)


### Features

* **next:** add workflow for pushing next artifacts to Azure Registry ([a61298d](https://github.com/MapColonies/jobnik-manager-test/commit/a61298dbab7e1348990b9afc18a9a21232ab1641))


### Miscellaneous Chores

* enforce correct rc version ([3a2bb8b](https://github.com/MapColonies/jobnik-manager-test/commit/3a2bb8b7a128cad627bd6e6e2ac6934fecaae4d5))

## [0.1.1-rc.38](https://github.com/MapColonies/jobnik-manager-test/compare/jobnik-manager-v1.0.0-rc.33...jobnik-manager-v0.1.1-rc.38) (2026-02-01)


### Bug Fixes

* test2 ([c14aaa8](https://github.com/MapColonies/jobnik-manager-test/commit/c14aaa88c3088368a921359aca3e6dfc52d246d0))


### Miscellaneous Chores

* enforce correct rc version ([4b372f2](https://github.com/MapColonies/jobnik-manager-test/commit/4b372f2979be8ca9cffbfcefb8cbea2b7ae90558))
* enforce correct rc version ([080a3b0](https://github.com/MapColonies/jobnik-manager-test/commit/080a3b0598b9e4b7756cb7f3248ccf4318ae7989))

## [1.0.0-rc.33](https://github.com/MapColonies/jobnik-manager-test/compare/jobnik-manager-v0.1.0...jobnik-manager-v1.0.0-rc.33) (2026-02-01)


### ⚠ BREAKING CHANGES

* clean python
* change the python
* : trigger CI 19
* test

### Features

* add comprehensive error handling from OpenAPI spec (MAPCO-7927) ([#89](https://github.com/MapColonies/jobnik-manager-test/issues/89)) ([225789d](https://github.com/MapColonies/jobnik-manager-test/commit/225789d6f16a96df96d7a92fe07a055557aad0e2))
* add cron job functionality for task cleanup (MAPCO-8350) ([#94](https://github.com/MapColonies/jobnik-manager-test/issues/94)) ([8de6cca](https://github.com/MapColonies/jobnik-manager-test/commit/8de6cca114ca076470663b10be037f95c43df02c))
* add isWaiting flag to stage creation for conditional status handling (MAPCO-7905) ([#40](https://github.com/MapColonies/jobnik-manager-test/issues/40)) ([e92d6a0](https://github.com/MapColonies/jobnik-manager-test/commit/e92d6a0efb8bb1127d1f473f2e0e3b05c04af218))
* add metrics for tracking in-progress jobs, stages, and tasks MAPCO-8206 ([#119](https://github.com/MapColonies/jobnik-manager-test/issues/119)) ([4105597](https://github.com/MapColonies/jobnik-manager-test/commit/4105597bfa229a7d233fe780a2a060de374466a8))
* add order field to stages for maintaining execution sequence and update related logic (MAPCO-7897) ([#72](https://github.com/MapColonies/jobnik-manager-test/issues/72)) ([1667e27](https://github.com/MapColonies/jobnik-manager-test/commit/1667e27a73c0512884cbf5be831069544b059936))
* add Prisma instrumentation for enhanced tracing and update related logic ([#76](https://github.com/MapColonies/jobnik-manager-test/issues/76)) ([b35aff9](https://github.com/MapColonies/jobnik-manager-test/commit/b35aff9c55963c770478091c7a8c8f2d97ee63de))
* add Python setup step for smart release action ([933a34d](https://github.com/MapColonies/jobnik-manager-test/commit/933a34d80c04b08c7dde77b770b61412e67410e1))
* add startTime and endTime fields to task model (MAPCO-8349) ([#93](https://github.com/MapColonies/jobnik-manager-test/issues/93)) ([2c17e42](https://github.com/MapColonies/jobnik-manager-test/commit/2c17e426aec4c9c56730d8985d7c4710a3846014))
* add userMetadata, creationTime, and updateTime to task and stage schemas as mandatory MAPCO-8576 ([#170](https://github.com/MapColonies/jobnik-manager-test/issues/170)) ([f26268e](https://github.com/MapColonies/jobnik-manager-test/commit/f26268e68d0196aff546a6c2dc0aa2507f4d2627))
* enhance job, stage and task status update descriptions and validations in OpenAPI spec  MAPCO-8783 ([#171](https://github.com/MapColonies/jobnik-manager-test/issues/171)) ([bd1c50b](https://github.com/MapColonies/jobnik-manager-test/commit/bd1c50bebc4a654a7d2b855ac6dea547e397c968))
* enhance tracing attributes in job, stage and task managers  MAPCO-8341 ([#169](https://github.com/MapColonies/jobnik-manager-test/issues/169)) ([3107027](https://github.com/MapColonies/jobnik-manager-test/commit/3107027db577bc277225e95d47c6247d6b4fc23a))
* enhance tracing support with traceparent and tracestate fields in jobs, stages, and tasks (MAPCO-8340) ([#78](https://github.com/MapColonies/jobnik-manager-test/issues/78)) ([b1c78f5](https://github.com/MapColonies/jobnik-manager-test/commit/b1c78f5ca15a2731d1554d9037241fddbc6190b4))
* implement automatic status propagation across job-stage-task hierarchy MAPCO-8785  MAPCO-8784 ([#153](https://github.com/MapColonies/jobnik-manager-test/issues/153)) ([7f80168](https://github.com/MapColonies/jobnik-manager-test/commit/7f8016811d65adeaa75f2491ca5c0a51b55a6fd2))
* implement stage status transition validation and update logic (MAPCO-8803) ([#146](https://github.com/MapColonies/jobnik-manager-test/issues/146)) ([1201f90](https://github.com/MapColonies/jobnik-manager-test/commit/1201f90dd0f7d6c6ec3bd738f2520583afcf70d0))
* integrate jobnik manager with config manager & schemas (MAPCO-7924) ([#116](https://github.com/MapColonies/jobnik-manager-test/issues/116)) ([4c3e716](https://github.com/MapColonies/jobnik-manager-test/commit/4c3e716a12edf020c6c8f6982d514cd46fee9a42))
* introduce v1 API structure with jobs, stages, and tasks endpoints MAPCO-8959 ([#205](https://github.com/MapColonies/jobnik-manager-test/issues/205)) ([dad0bd3](https://github.com/MapColonies/jobnik-manager-test/commit/dad0bd3b7844346dad9754ed77ec2af42728890a))
* Jobnik Manager: project skeleton & core functions ([#34](https://github.com/MapColonies/jobnik-manager-test/issues/34)) ([099bc8d](https://github.com/MapColonies/jobnik-manager-test/commit/099bc8d12c81b18f1d8f76d7658b23bed561e976))
* test ([99bad03](https://github.com/MapColonies/jobnik-manager-test/commit/99bad035dbe666efb0860b08784043ad073e4c4c))
* trigger CI 11 ([be875ac](https://github.com/MapColonies/jobnik-manager-test/commit/be875acf860f876dcdd4b1e0adda3d4b2217ecd0))
* trigger CI 17 ([d8ec075](https://github.com/MapColonies/jobnik-manager-test/commit/d8ec075e80c84ea8184ee7c3bb4409b31f082139))


### Bug Fixes

* 1 ([f0c42a2](https://github.com/MapColonies/jobnik-manager-test/commit/f0c42a26e007ca6dfa09f41dd06e0ae7914d322e))
* 2 ([d5ccfa5](https://github.com/MapColonies/jobnik-manager-test/commit/d5ccfa532346bcdf8b9eb44fc992ce7b36791cd1))
* clean python ([db24286](https://github.com/MapColonies/jobnik-manager-test/commit/db2428603c5010672059069f0a9afe75384eb236))
* include first-parent in commit depth log command ([40e6201](https://github.com/MapColonies/jobnik-manager-test/commit/40e6201cde0d2fd3cb604602b4b5201b2d3101eb))
* remove unused previewFeatures from prisma client generator ([2159346](https://github.com/MapColonies/jobnik-manager-test/commit/2159346088de43d409472bcd018f115245798e43))
* restore ([92956e0](https://github.com/MapColonies/jobnik-manager-test/commit/92956e0ef7f7c5387eba3fb93db5b1385a00e012))
* **smart-release-please:** enhance version management for RC and stable releases ([253bd71](https://github.com/MapColonies/jobnik-manager-test/commit/253bd7125699006f5a6aeb18b840e086fd5879dd))
* test ([e891eca](https://github.com/MapColonies/jobnik-manager-test/commit/e891eca784c877d27e8bd72ea906626ac19091a9))
* test ([78d37c3](https://github.com/MapColonies/jobnik-manager-test/commit/78d37c33c51bccecacfab4ad986d904d30eb8663))
* test 1 ([e4dcd6f](https://github.com/MapColonies/jobnik-manager-test/commit/e4dcd6f777c4f824a1e10b7bc464d8a34b464c6d))
* test 1 ([8e5201b](https://github.com/MapColonies/jobnik-manager-test/commit/8e5201b9da0147e2937c8692684a66091f29c9d9))
* test 2 ([ef8f1fe](https://github.com/MapColonies/jobnik-manager-test/commit/ef8f1fe9e32c4bbb81a833e1dc1f380f1f46413b))
* test 2 ([e11a0c1](https://github.com/MapColonies/jobnik-manager-test/commit/e11a0c193f5ffa2b5f750077bc68ca5ec2aa36d8))
* test fix ([7e6bb5f](https://github.com/MapColonies/jobnik-manager-test/commit/7e6bb5fcdd6622f79ad4c3d779aeaf2ecd2f2e64))
* trigger CI ([1f4a38a](https://github.com/MapColonies/jobnik-manager-test/commit/1f4a38aae563bacfbfbec0fdaf97c86023c00bb1))
* trigger CI ([0658d10](https://github.com/MapColonies/jobnik-manager-test/commit/0658d10d869d3fac5c7908b619901d2748cdfc66))
* trigger CI ([2490b3d](https://github.com/MapColonies/jobnik-manager-test/commit/2490b3d05980b7de467e2ed4f5cc771d498abb99))
* trigger CI ([a162884](https://github.com/MapColonies/jobnik-manager-test/commit/a162884af9d6f986bf1384e27eadb32fea9bdbf3))
* trigger CI ([96ad1bf](https://github.com/MapColonies/jobnik-manager-test/commit/96ad1bf924a6f24c092e57d245b6367d211d6b9a))
* trigger CI ([3f96e7a](https://github.com/MapColonies/jobnik-manager-test/commit/3f96e7aae979721cff1a181f9d1d17a87e672929))
* trigger CI ([9830c83](https://github.com/MapColonies/jobnik-manager-test/commit/9830c83c62a52ce45fc1e2882ddae37cd4f777d7))
* trigger CI ([6652073](https://github.com/MapColonies/jobnik-manager-test/commit/6652073ca3aa0d6f690d25ac860cc0c2dd9f8ba5))
* trigger CI 11 ([0ceaab7](https://github.com/MapColonies/jobnik-manager-test/commit/0ceaab769f5676e5303e42d22b515b88bb5e462b))
* trigger CI 2 ([6ef0224](https://github.com/MapColonies/jobnik-manager-test/commit/6ef0224f581eb7be411f2b5f63f3ea250685bb01))
* trigger CI 2 ([b5ab86c](https://github.com/MapColonies/jobnik-manager-test/commit/b5ab86ca15106f91faa000dfd24a3975ae4fd3b8))
* trigger rc ([a408c78](https://github.com/MapColonies/jobnik-manager-test/commit/a408c780eec5cbd1fcf478cbba72de7cbc079772))
* trigger rc ([74047f1](https://github.com/MapColonies/jobnik-manager-test/commit/74047f19bf89307831bd0e2f4bcc9a7962efc08d))
* trigger rc ([f71b21d](https://github.com/MapColonies/jobnik-manager-test/commit/f71b21d887f76188eaa8a13c8d37fec2566c80f4))


### Miscellaneous Chores

* enforce correct rc version ([3681800](https://github.com/MapColonies/jobnik-manager-test/commit/3681800c52610e024e78c31da00d7aa1b519ec00))
* enforce correct rc version ([94bbab1](https://github.com/MapColonies/jobnik-manager-test/commit/94bbab19a11a7ff1ced79b4bf31acde3fe05500a))
* enforce correct rc version ([6ff5c81](https://github.com/MapColonies/jobnik-manager-test/commit/6ff5c81435fa6522cc1a995904ba2a7b1547c78f))
* enforce correct rc version ([ce99dd6](https://github.com/MapColonies/jobnik-manager-test/commit/ce99dd6ceba830f6bc1b80e84a811485219a7ecd))
* enforce correct rc version ([5611951](https://github.com/MapColonies/jobnik-manager-test/commit/56119517a8fd3fab2b69c5ecd35c5cfc6efd6b55))
* enforce correct rc version ([2e59db7](https://github.com/MapColonies/jobnik-manager-test/commit/2e59db74386bd82030607e831ff046c77b32506d))
* enforce correct rc version ([daeedeb](https://github.com/MapColonies/jobnik-manager-test/commit/daeedebdef91bef5b76d5157431913bc73b62afa))
* enforce correct rc version ([a98c129](https://github.com/MapColonies/jobnik-manager-test/commit/a98c1291489898c1d83124472e562c021c28c584))
* enforce correct rc version ([4e91033](https://github.com/MapColonies/jobnik-manager-test/commit/4e910336ef8a82a3b02fdb906cf9612f5f21acce))
* enforce correct rc version ([94a6c19](https://github.com/MapColonies/jobnik-manager-test/commit/94a6c19b49add6d414b5a9da5e7e563ba2c86c93))
* enforce correct rc version ([eb94f34](https://github.com/MapColonies/jobnik-manager-test/commit/eb94f3426ce3d1041e6a85f0c263bb7f3f743023))
* enforce correct rc version ([c9cb701](https://github.com/MapColonies/jobnik-manager-test/commit/c9cb701cb9ea9539b177c748f77981742d2b354c))
* enforce correct rc version ([7ccda96](https://github.com/MapColonies/jobnik-manager-test/commit/7ccda9653f2d4d204dffac083b49caeed64c7800))
* enforce correct rc version ([988d88b](https://github.com/MapColonies/jobnik-manager-test/commit/988d88bc827fd9b5b99e92c15622413b7c731d3d))
* enforce correct rc version ([0978b63](https://github.com/MapColonies/jobnik-manager-test/commit/0978b63a0252df10ede47f4ae6927ba4f7392260))
* enforce correct rc version ([769f4b3](https://github.com/MapColonies/jobnik-manager-test/commit/769f4b32fbdbef9558b2dadbff96e66a0cff5ac4))
* enforce correct rc version ([56235ce](https://github.com/MapColonies/jobnik-manager-test/commit/56235ce1d6f3c080d0070c3a6d3403535ebc64b7))
* enforce correct rc version ([abd9ccb](https://github.com/MapColonies/jobnik-manager-test/commit/abd9ccb48fa699744363e2b1f94cf882566f9d26))
* enforce correct rc version ([70dfb40](https://github.com/MapColonies/jobnik-manager-test/commit/70dfb40d98097e5371e1cf6608c01cf28c3c8d6a))
* enforce correct rc version ([60e6a32](https://github.com/MapColonies/jobnik-manager-test/commit/60e6a32b4735005a98cede55c042c5b50a7198d8))
* enforce correct rc version ([8e395b7](https://github.com/MapColonies/jobnik-manager-test/commit/8e395b7c3801ae60813f1816554d2de11cc30afc))
* enforce correct rc version ([128128c](https://github.com/MapColonies/jobnik-manager-test/commit/128128c2b6c805728e1ba935fb16e7ee6e0df8b2))
* enforce correct rc version ([00ce1d6](https://github.com/MapColonies/jobnik-manager-test/commit/00ce1d6d746ca66a798bf5b8574f428053e45bbb))
* enforce correct rc version ([4799343](https://github.com/MapColonies/jobnik-manager-test/commit/47993435ef0d751672de97e4f52aaecaeb6426f5))
* enforce correct rc version ([dd2b2dd](https://github.com/MapColonies/jobnik-manager-test/commit/dd2b2dd031c4e66c5cc3ddfc6711deaa264ae8a7))
* enforce correct rc version ([3e2d60c](https://github.com/MapColonies/jobnik-manager-test/commit/3e2d60ce79d79ce2e09dfea120de3a849c410544))
* enforce correct rc version ([235e037](https://github.com/MapColonies/jobnik-manager-test/commit/235e037f4f3172d919d1ee38309ed279c59a62d5))
* enforce correct rc version ([c4c04d1](https://github.com/MapColonies/jobnik-manager-test/commit/c4c04d10e0f7f966d5042ec4fdaef140d67180de))
* enforce correct rc version ([3f045bd](https://github.com/MapColonies/jobnik-manager-test/commit/3f045bdb92734472e5218e623a24c55e45b2d901))
* enforce correct rc version ([b06cd35](https://github.com/MapColonies/jobnik-manager-test/commit/b06cd3571993f2d8623f94ee1e1c4c354c8e2380))
* enforce correct rc version ([10f383f](https://github.com/MapColonies/jobnik-manager-test/commit/10f383f207b16fb54ed438853da5bda2a3989fe3))
* enforce correct rc version ([ae6468c](https://github.com/MapColonies/jobnik-manager-test/commit/ae6468c54a32b2185defe32333eccce47489bec8))
* enforce correct rc version ([e7031db](https://github.com/MapColonies/jobnik-manager-test/commit/e7031db1453018476514def40bb51e742e80abd7))
* enforce correct rc version ([73fc477](https://github.com/MapColonies/jobnik-manager-test/commit/73fc477670244c9c46868c2d3300b89a5047c443))


### Code Refactoring

* : trigger CI 19 ([1596791](https://github.com/MapColonies/jobnik-manager-test/commit/159679199c40ac813c2a34577d1c6d105fa528e9))
* change the python ([54bb995](https://github.com/MapColonies/jobnik-manager-test/commit/54bb995ab00840b635a3754ff693fdb418e7e45c))
* clean python ([1595795](https://github.com/MapColonies/jobnik-manager-test/commit/15957958ad7ebc5cb5732de44bdfa518de726900))

## 0.1.0 (2025-11-16)


### Features

* add comprehensive error handling from OpenAPI spec (MAPCO-7927) ([#89](https://github.com/MapColonies/jobnik-manager/issues/89)) ([225789d](https://github.com/MapColonies/jobnik-manager/commit/225789d6f16a96df96d7a92fe07a055557aad0e2))
* add cron job functionality for task cleanup (MAPCO-8350) ([#94](https://github.com/MapColonies/jobnik-manager/issues/94)) ([8de6cca](https://github.com/MapColonies/jobnik-manager/commit/8de6cca114ca076470663b10be037f95c43df02c))
* add isWaiting flag to stage creation for conditional status handling (MAPCO-7905) ([#40](https://github.com/MapColonies/jobnik-manager/issues/40)) ([e92d6a0](https://github.com/MapColonies/jobnik-manager/commit/e92d6a0efb8bb1127d1f473f2e0e3b05c04af218))
* add metrics for tracking in-progress jobs, stages, and tasks MAPCO-8206 ([#119](https://github.com/MapColonies/jobnik-manager/issues/119)) ([4105597](https://github.com/MapColonies/jobnik-manager/commit/4105597bfa229a7d233fe780a2a060de374466a8))
* add order field to stages for maintaining execution sequence and update related logic (MAPCO-7897) ([#72](https://github.com/MapColonies/jobnik-manager/issues/72)) ([1667e27](https://github.com/MapColonies/jobnik-manager/commit/1667e27a73c0512884cbf5be831069544b059936))
* add Prisma instrumentation for enhanced tracing and update related logic ([#76](https://github.com/MapColonies/jobnik-manager/issues/76)) ([b35aff9](https://github.com/MapColonies/jobnik-manager/commit/b35aff9c55963c770478091c7a8c8f2d97ee63de))
* add startTime and endTime fields to task model (MAPCO-8349) ([#93](https://github.com/MapColonies/jobnik-manager/issues/93)) ([2c17e42](https://github.com/MapColonies/jobnik-manager/commit/2c17e426aec4c9c56730d8985d7c4710a3846014))
* add userMetadata, creationTime, and updateTime to task and stage schemas as mandatory MAPCO-8576 ([#170](https://github.com/MapColonies/jobnik-manager/issues/170)) ([f26268e](https://github.com/MapColonies/jobnik-manager/commit/f26268e68d0196aff546a6c2dc0aa2507f4d2627))
* enhance job, stage and task status update descriptions and validations in OpenAPI spec  MAPCO-8783 ([#171](https://github.com/MapColonies/jobnik-manager/issues/171)) ([bd1c50b](https://github.com/MapColonies/jobnik-manager/commit/bd1c50bebc4a654a7d2b855ac6dea547e397c968))
* enhance tracing attributes in job, stage and task managers  MAPCO-8341 ([#169](https://github.com/MapColonies/jobnik-manager/issues/169)) ([3107027](https://github.com/MapColonies/jobnik-manager/commit/3107027db577bc277225e95d47c6247d6b4fc23a))
* enhance tracing support with traceparent and tracestate fields in jobs, stages, and tasks (MAPCO-8340) ([#78](https://github.com/MapColonies/jobnik-manager/issues/78)) ([b1c78f5](https://github.com/MapColonies/jobnik-manager/commit/b1c78f5ca15a2731d1554d9037241fddbc6190b4))
* implement automatic status propagation across job-stage-task hierarchy MAPCO-8785  MAPCO-8784 ([#153](https://github.com/MapColonies/jobnik-manager/issues/153)) ([7f80168](https://github.com/MapColonies/jobnik-manager/commit/7f8016811d65adeaa75f2491ca5c0a51b55a6fd2))
* implement stage status transition validation and update logic (MAPCO-8803) ([#146](https://github.com/MapColonies/jobnik-manager/issues/146)) ([1201f90](https://github.com/MapColonies/jobnik-manager/commit/1201f90dd0f7d6c6ec3bd738f2520583afcf70d0))
* integrate jobnik manager with config manager & schemas (MAPCO-7924) ([#116](https://github.com/MapColonies/jobnik-manager/issues/116)) ([4c3e716](https://github.com/MapColonies/jobnik-manager/commit/4c3e716a12edf020c6c8f6982d514cd46fee9a42))
* Jobnik Manager: project skeleton & core functions ([#34](https://github.com/MapColonies/jobnik-manager/issues/34)) ([099bc8d](https://github.com/MapColonies/jobnik-manager/commit/099bc8d12c81b18f1d8f76d7658b23bed561e976))


### Bug Fixes

* remove unused previewFeatures from prisma client generator ([2159346](https://github.com/MapColonies/jobnik-manager/commit/2159346088de43d409472bcd018f115245798e43))
