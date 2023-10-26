import { Profile } from '../src';

test('makeZoneFileForHostedProfile', () => {
  const fileUrl = 'https://_example_.s3.amazonaws.com/naval.id/profile.json';
  const incorrectFileUrl = 'mq9.s3.amazonaws.com/naval.id/profile.json';
  const zoneFile = Profile.makeZoneFile('naval.id', fileUrl);
  expect(zoneFile).toBeTruthy();
  expect(zoneFile.includes(`"${fileUrl}"`)).toBeTruthy();
  expect(zoneFile.includes(`"${incorrectFileUrl}"`)).not.toBeTruthy();
});

test('makeZoneFileForHostedProfile', () => {
  const fileUrl = 'https://_example_.s3.amazonaws.com/naval.id/profile.json';
  const incorrectFileUrl = 'mq9.s3.amazonaws.com/naval.id/profile.json';
  const zoneFile = Profile.makeZoneFile('naval.id', fileUrl);

  expect(zoneFile).toBeTruthy();
  expect(zoneFile.includes(`"${fileUrl}"`)).toBeTruthy();
  expect(zoneFile.includes(`"${incorrectFileUrl}"`)).not.toBeTruthy();
});
