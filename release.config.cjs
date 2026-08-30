const conventionalCommits = {
  preset: 'conventionalcommits',
  presetConfig: {},
};

module.exports = {
  branches: ['main'],
  tagFormat: 'v${version}',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        ...conventionalCommits,
        releaseRules: [
          { breaking: true, release: 'major' },
          { type: 'feat', release: 'minor' },
          { type: 'build', release: 'patch' },
          { type: 'chore', release: 'patch' },
          { type: 'ci', release: 'patch' },
          { type: 'docs', release: 'patch' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'revert', release: 'patch' },
          { type: 'style', release: 'patch' },
          { type: 'test', release: 'patch' },
        ],
      },
    ],
    ['@semantic-release/release-notes-generator', conventionalCommits],
    '@semantic-release/changelog',
    '@semantic-release/npm',
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]',
      },
    ],
    [
      '@semantic-release/github',
      {
        successCommentCondition: false,
        failCommentCondition: false,
        releasedLabels: false,
      },
    ],
  ]
};
