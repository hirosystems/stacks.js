export function getName(profile: any) {
  if (!profile) {
    return null;
  }

  let name = null;
  if (profile.name) {
    name = profile.name;
  } else if (profile.givenName || profile.familyName) {
    name = '';
    if (profile.givenName) {
      name = profile.givenName;
    }
    if (profile.familyName) {
      name += ` ${profile.familyName}`;
    }
  }
  return name;
}

/**
 *
 * @ignore
 */
export function getGivenName(profile: any) {
  if (!profile) {
    return null;
  }

  let givenName = null;
  if (profile.givenName) {
    givenName = profile.givenName;
  } else if (profile.name) {
    const nameParts = profile.name.split(' ');
    givenName = nameParts.slice(0, -1).join(' ');
  }
  return givenName;
}

/**
 *
 * @ignore
 */
export function getFamilyName(profile: any) {
  if (!profile) {
    return null;
  }

  let familyName = null;
  if (profile.familyName) {
    familyName = profile.familyName;
  } else if (profile.name) {
    const nameParts = profile.name.split(' ');
    familyName = nameParts.pop();
  }
  return familyName;
}

/**
 *
 * @ignore
 */
export function getDescription(profile: any) {
  if (!profile) {
    return null;
  }

  let description = null;
  if (profile.description) {
    description = profile.description;
  }
  return description;
}

/**
 *
 * @ignore
 */
export function getAvatarUrl(profile: any) {
  if (!profile) {
    return null;
  }

  let avatarContentUrl: string | null = null;
  if (profile.image) {
    profile.image.map((image: any) => {
      if (image.name === 'avatar') {
        avatarContentUrl = image.contentUrl;
        return avatarContentUrl;
      } else {
        return null;
      }
    });
  }
  return avatarContentUrl;
}

/**
 *
 * @ignore
 */
export function getVerifiedAccounts(profile: any, verifications?: any[]) {
  if (!profile) {
    return null;
  }

  const filteredAccounts: any[] = [];
  if (profile.hasOwnProperty('account') && verifications) {
    profile.account.map((account: any) => {
      let accountIsValid = false;
      let proofUrl = null;

      verifications.map(verification => {
        if (verification.hasOwnProperty('proof_url')) {
          verification.proofUrl = verification.proof_url;
        }
        if (
          verification.valid &&
          verification.service === account.service &&
          verification.identifier === account.identifier &&
          verification.proofUrl
        ) {
          accountIsValid = true;
          proofUrl = verification.proofUrl;
          return true;
        } else {
          return false;
        }
      });

      if (accountIsValid) {
        account.proofUrl = proofUrl;
        filteredAccounts.push(account);
        return account;
      } else {
        return null;
      }
    });
  }
  return filteredAccounts;
}

/**
 *
 * @ignore
 */
export function getOrganizations(profile: any) {
  if (!profile) {
    return null;
  }

  const organizations: any[] = [];

  if (profile.hasOwnProperty('worksFor')) {
    return profile.worksFor;
  }

  return organizations;
}

/**
 *
 * @ignore
 */
export function getConnections(profile: any) {
  if (!profile) {
    return null;
  }

  let connections = [];

  if (profile.hasOwnProperty('knows')) {
    connections = profile.knows;
  }

  return connections;
}

/**
 *
 * @ignore
 */
export function getAddress(profile: any) {
  if (!profile) {
    return null;
  }

  let addressString = null;

  if (profile.hasOwnProperty('address')) {
    const addressParts = [];

    if (profile.address.hasOwnProperty('streetAddress')) {
      addressParts.push(profile.address.streetAddress);
    }
    if (profile.address.hasOwnProperty('addressLocality')) {
      addressParts.push(profile.address.addressLocality);
    }
    if (profile.address.hasOwnProperty('postalCode')) {
      addressParts.push(profile.address.postalCode);
    }
    if (profile.address.hasOwnProperty('addressCountry')) {
      addressParts.push(profile.address.addressCountry);
    }

    if (addressParts.length) {
      addressString = addressParts.join(', ');
    }
  }

  return addressString;
}

/**
 *
 * @ignore
 */
export function getBirthDate(profile: any) {
  if (!profile) {
    return null;
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  let birthDateString = null;

  if (profile.hasOwnProperty('birthDate')) {
    const date = new Date(profile.birthDate);
    birthDateString = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  return birthDateString;
}
