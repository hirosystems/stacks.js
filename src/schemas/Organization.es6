class Organization {
  constructor(profile = {}, context = 'http://schema.org/') {
    this.profile = Object.assign({}, {
      '@context': context,
      '@type': 'Organization'
    }, profile)
  }
}

export default Organization