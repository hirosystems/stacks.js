class Person {
  constructor(profile, context) {
    if (!context) {
      context = 'http://schema.org/'
    }
    if (!profile) {
      profile = {}
    }
    this.profile = Object.assign({}, {
      '@context': context,
      '@type': 'Organization'
    }, profile)
  }
}

export default Person