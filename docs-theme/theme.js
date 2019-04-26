const { DefaultTheme, Renderer } = require('typedoc');
const { RendererEvent } = require('typedoc/dist/lib/output/events');
const Handlebars = require('handlebars');

module.exports = class CustomTheme extends DefaultTheme {

  /**
   * @param {Renderer} renderer 
   * @param {string} basePath 
   */
  constructor(renderer, basePath) {
    super(renderer, basePath);
    this.listenTo(renderer, RendererEvent.BEGIN, (e) => this.handleRenderBegin(e, renderer), 1024);
  }

  /**
   * @param {RendererEvent} event
   * @param {Renderer} renderer 
   */
  handleRenderBegin(event, renderer) {
    // Swap out `header` template with `header-override` template.
    const overrideResource = renderer.theme.resources.partials.getResource('header-override')
    const headerResource = renderer.theme.resources.partials.getResource('header')
    Handlebars.registerPartial('header-original', headerResource.getTemplate())
    Handlebars.registerPartial('header', overrideResource.getTemplate())
  }

}
