export class CreativeWork {
  constructor(profile = {}, context = 'http://schema.org/') {
    this.profile = Object.assign({}, {
      '@context': context,
      '@type': 'CreativeWork'
    }, profile)
  }
}