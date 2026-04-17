danger.import_dangerfile(github: 'RevenueCat/Dangerfile')

# Block accidental version bumps outside release/* branches.
# The proper flow is `bundle exec fastlane bump`, which updates .version,
# package.json, and src/helpers/constants.ts atomically. Manual edits have
# caused drift in the past.
head_branch = github.branch_for_head
unless head_branch.to_s.start_with?('release/')
  version_file_checks = {
    'package.json' => /^[-+]\s*"version":\s*"[^"]+"/,
    'src/helpers/constants.ts' => /^[-+].*VERSION\s*=\s*"[^"]+"/,
    '.version' => /./
  }

  touched = (git.modified_files + git.added_files).uniq
  version_file_checks.each do |path, version_line_pattern|
    next unless touched.include?(path)

    diff = git.diff_for_file(path)
    next if diff.nil?
    next unless diff.patch.to_s.lines.any? { |line| line =~ version_line_pattern }

    fail(
      "`#{path}` contains a version change, but this PR is not targeting a `release/*` branch. " \
      "Versions are managed by Fastlane — please revert the change and either run `bundle exec fastlane bump` " \
      "locally, or trigger the `manual-trigger-bump` pipeline in CircleCI with the `action` parameter set to " \
      "`bump`. See `fastlane/Fastfile` and `.circleci/config.yml` for the release flow."
    )
  end
end
