import type { BrandId, BrandShell } from "./brand.types";

const BASE_SFMC_CSS = `#outlook a{padding:0}
.ReadMsgBody{width:100%}
.ExternalClass{width:100%}
.ExternalClass,.ExternalClass p,.ExternalClass span,.ExternalClass font,.ExternalClass td,.ExternalClass div{line-height:100%}
body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
p{margin:0;margin-bottom:16px}
a:visited{color:inherit;text-decoration:none}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
.viewport-mail{background-color:#f2f2f2!important}
.container-mail{width:600px;max-width:600px;margin:0 auto;background:#fff}
img{max-width:100%!important;height:auto!important;display:block!important}
.desktop{display:block!important;overflow:visible!important;opacity:1!important;line-height:auto!important;height:auto!important}
.mobile{display:none!important;overflow:hidden!important;opacity:0!important;line-height:0!important;height:0!important}
.subllamado{font-size:13px}
@media only screen and (max-width:600px){
  .container-mail{width:100%!important}
  .subllamado{font-size:14px}
  .table{width:100%!important}
  .wrapper40{padding-left:40px!important;padding-right:40px!important}
  .wrapper20{padding-left:20px!important;padding-right:20px!important}
  .column{width:100%!important;height:auto;display:block!important;padding-left:0!important;padding-right:0!important}
  .two-column{width:100%!important}
  .responsive{width:100%!important}
  .responsive90{width:90%!important}
  .responsive70{width:70%!important}
  .responsive50{width:50%!important}
  .paddingbottom20{padding-bottom:20px!important}
  .paddingtop20{padding-top:20px!important}
  .paddingleft20{padding-left:20px!important}
  .paddingright20{padding-right:20px!important}
  .center{float:none!important}
  .desktop{display:none!important;overflow:hidden!important;opacity:0!important;line-height:0!important;height:0!important}
  .mobile{display:block!important;overflow:visible!important;opacity:1!important;line-height:auto!important;height:auto!important}
}`;

const SANTA_ISABEL_HEADER = `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto;">
        <tbody>
          <tr>
            <td align="center" valign="top">
              <table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:600px;">
                <tbody>
                  <tr>
                    <td rowspan="3" valign="top">
                      <a href="https://www.santaisabel.cl/" target="_blank">
                        <img src="http://image.contenido.cencosud.cl/lib/fe9112727d63007e75/m/4/SISAheader_01.jpg" width="144" height="99" style="display:block;border:none;max-width:none!important;" alt="Santa Isabel">
                      </a>
                    </td>
                    <td valign="top">
                      <img src="http://image.contenido.cencosud.cl/lib/fe9112727d63007e75/m/4/SISAheader_02.jpg" width="456" height="23" style="display:block;border:none;max-width:none!important;" alt="">
                    </td>
                  </tr>
                  <tr>
                    <td bgcolor="#FFFFFF">
                      <p style="font-family:Arial,Helvetica,sans-serif;text-align:left;color:#333333;font-size:24px;line-height:24px;display:block;margin-right:5px;margin-top:8px;margin-bottom:0;">
                        <span style="font-weight:bold;">Hola, <b>%%nombre%%</b><br></span>
                        <span style="font-family:arial,sans-serif;color:#333333;font-size:13px;text-align:left;line-height:13px;font-weight:normal;">%%=ContentBlockByName("Shared Content\\Saldo Puntos\\Saldo de Puntos sin Nombre para Hybris")=%%</span>
                      </p>
                    </td>
                  </tr>
                  <tr><td></td></tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
</table>`;

const SANTA_ISABEL_FOOTER = `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center">
        <tr>
          <td align="center">
            <a href="%%=RedirectTo(Concat('https://sisaapp.page.link/?link=https://www.santaisabel.cl/%3F',@utm_source,'%26',@utm_medium,'%26','utm_campaign=descargaapp','_',@fechaenvio,'%26','utm_content=huincha-descarga','%26','apn=com.cencosud.cl.sisa','%26','ibi=com.cencosud.santaisabel.cl','%26','efr=1','%26','isi=1585842731'))=%%" target="_blank" style="text-decoration:none;display:block;">
              <img src="https://image.contenido.cencosud.cl/lib/fe9112727d63007e75/m/1/c7f4e36f-d75d-4f5d-8d4c-7ac592cfc851.jpg" alt="" width="600" style="display:block;width:100%;height:auto;border:0;">
            </a>
          </td>
        </tr>
        <tr>
          <td align="center">
            <a href="https://api.whatsapp.com/send/?phone=56950131501&text=Hola%2C+podr%C3%ADan+ayudarme+con+mi+requerimiento+por+favor&type=phone_number&app_absent=0" target="_blank" style="text-decoration:none;display:block;">
              <img src="https://cencosud-assets.codelex.dev/uploads/oosybiG6vXnkNdvBs-footerwsp.png" alt="" width="600" style="display:block;width:100%;height:auto;border:0;">
            </a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:16px;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#666666;font-weight:normal;font-size:12px;">
            <p style="padding:0;margin:0;">Ofertas válidas sujeto a disponibilidad de stock. Descuentos no acumulables con otras promociones. Ofertas válidas pagando con Tarjeta Cencosud o Todo Medio de Pago dependiendo de oferta indicada. Para todas las ofertas se permitirá un máximo de 10 unidades por Rut. No aplica a compras con factura.</p>
          </td>
        </tr>
        <tr>
          <td align="center">
            <table border="0" cellspacing="0" cellpadding="0" align="center" width="100%" bgcolor="#db0613">
              <tbody>
                <tr>
                  <td valign="middle" width="40%">
                    <a href="https://www.santaisabel.cl/" target="_blank">
                      <img src="https://image.contenido.cencosud.cl/lib/fe9112727d63007e75/m/1/3be5fcbc-2df3-4d35-afbc-da1df029b873.jpg" style="display:block;border:none;" alt="Santa Isabel">
                    </a>
                  </td>
                  <td valign="middle" width="10%">
                    <a href="https://www.facebook.com/SantaIsabelCL" target="_blank">
                      <img src="https://image.contenido.cencosud.cl/lib/fe9112727d63007e75/m/1/37b05acb-1462-4b1b-9d36-cc730484efd7.jpg" style="display:block;border:none;" alt="Facebook">
                    </a>
                  </td>
                  <td valign="middle" width="10%">
                    <a href="https://www.instagram.com/santaisabelcl" target="_blank">
                      <img src="https://image.contenido.cencosud.cl/lib/fe9112727d63007e75/m/1/9bc243bf-1f99-4a9c-8d05-ae0d2001d0ff.jpg" style="display:block;border:none;" alt="Instagram">
                    </a>
                  </td>
                  <td valign="middle" width="10%">
                    <img src="https://image.contenido.cencosud.cl/lib/fe9112727d63007e75/m/1/f12a8f76-a780-4547-a49f-1ca3a6d241a8.jpg" style="display:block;border:none;" alt="">
                  </td>
                  <td valign="middle" width="10%">
                    <img src="https://image.contenido.cencosud.cl/lib/fe9112727d63007e75/m/1/94ef2830-1f59-44bd-9c1a-ce32329f1271.jpg" style="display:block;border:none;" alt="">
                  </td>
                  <td valign="middle" width="20%">
                    <img src="https://image.contenido.cencosud.cl/lib/fe9112727d63007e75/m/1/77e1d48e-09a1-43bd-b331-cec6e697b938.jpg" style="display:block;border:none;" alt="">
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

const JUMBO_HEADER = `<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
        <tr>
          <td align="center" style="padding:20px;">
            <a href="https://www.jumbo.cl/" target="_blank" style="text-decoration:none;">
              <img src="https://cencosud-assets.codelex.dev/uploads/LQdpgFDbYNy55SHD5-logojumbo50.svg" alt="Jumbo" width="420" style="display:block;border:0;">
            </a>
          </td>
        </tr>
        <tr>
          <td>
            <table width="600" align="center" border="0" cellpadding="0" cellspacing="0" style="width:600px;background-color:#2DC850;margin:0 auto;font-family:Arial,Helvetica,sans-serif;">
              <tr>
                <td style="padding:10px 0;text-align:center;font-size:0;">
                  <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin:auto;">
                    <tr>
                      <td>
                        <img style="display:block!important;" src="https://cencosud-assets.codelex.dev/sodlab/0KwkyC1rBeWVXoBsp-banner-6Zkke3C4dva8Jhqdb.png" alt="">
                      </td>
                      <td>
                        <img style="display:block!important;" src="https://cencosud-assets.codelex.dev/sodlab/Rmp3tNQfVeZOSqSUj-banner-6Zkke3C4dva8Jhqdb.png" alt="">
                      </td>
                      <td>
                        <img style="display:block!important;" src="https://cencosud-assets.codelex.dev/sodlab/mQWddb2m63RHXVZnR-banner-6Zkke3C4dva8Jhqdb.png" alt="">
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 20px 0 20px;">
            <div style="display:inline-block;line-height:1;font-family:'Arial'!important;font-size:22px;color:#009640;font-weight:400;text-align:left;">
              Hola %%nombre%%
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:5px 20px;">
            <div style="display:inline-block;line-height:1;font-family:'Arial'!important;font-size:14px;font-weight:500;text-align:left;color:#009640;margin:0;padding:0;">
              %%=ContentBlockByName("Shared Content\\Saldo Puntos\\Saldo de Puntos sin Nombre para Hybris")=%%
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

const JUMBO_FOOTER = `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center">
        <tr>
          <td align="center">
            <img width="600" src="https://cencosud-assets.codelex.dev/uploads/LdoEdof7NcwZBcr2a-minsal100.jpg" style="outline:none;border:none;text-decoration:none;vertical-align:middle;display:inline-block;max-width:100%!important;width:600px!important;" alt="">
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:16px 0;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#666666;font-weight:normal;font-size:12px;">
            <p style="padding:0;margin:0;"><strong>Ofertas válidas sujeto a disponibilidad de stock.</strong> Pagando con Tarjeta Cencosud o Todo Medio de Pago dependiendo de oferta indicada. Para todas las campañas se permitirá un máximo de 10 unidades por RUT. Productos de carnes rojas y blancas máximo 10 kilos por persona. Oferta bebidas alcohólicas venta solo a mayores de 18 años. Ofertas y promociones no acumulables con otras vigentes y no incluyen accesorios mostrados. No aplica a compras con factura.</p>
          </td>
        </tr>
        <tr>
          <td align="center">
            <a href="https://jumbocl.onelink.me/azol?af_web_dp=httpsA%2F%2Fwww.jumbo.cl%2F%3F" target="_blank" style="text-decoration:none;display:block;">
              <img src="https://image.contenido.cencosud.cl/lib/fe8b12727d63007f72/m/28/aee12f30-b229-4584-8676-40fc132e8a08.jpg" alt="" width="600" style="display:block;padding:0;text-align:center;height:auto;width:100%;border:0;">
            </a>
          </td>
        </tr>
        <tr>
          <td align="center">
            <a href="https://ayuda.jumbo.cl/" target="_blank" style="text-decoration:none;display:block;">
              <img src="http://image.contenido.cencosud.cl/lib/fe8b12727d63007f72/m/24/8157bc2b-33dc-4056-b93f-5a3ee1473537.jpg" alt="" width="600" style="display:block;padding:0;text-align:center;height:auto;width:100%;border:0;">
            </a>
          </td>
        </tr>
        <tr>
          <td class="drop" valign="top" align="left" width="100%">
            <table border="0" cellspacing="0" cellpadding="0" align="center" width="100%" style="border-collapse:collapse;">
              <tr>
                <td style="border-top:#009640 solid 2px;padding-bottom:10px;">
                  <p style="color:#009640;font-family:Arial,sans-serif;font-size:12px;line-height:14px;text-align:center;margin:0;padding:0;">
                    <a href="https://www.jumbo.cl/institucional/servicios?s=online-house&q=3" target="_blank" style="color:#009640;text-decoration:none;">Cobertura de despacho</a>
                    |
                    <a href="https://www.jumbo.cl/institucional/locales-jumbo" target="_blank" style="color:#009640;text-decoration:none;">Locales Jumbo</a>
                    |
                    <span style="color:#009640;">600 400 3000</span>
                    | Síguenos en:
                    <a href="https://www.facebook.com/jumbochile" target="_blank" style="color:#009640;text-decoration:none;">Facebook</a>
                    -
                    <a href="https://www.youtube.com/channel/UC-XcgdCklkldBJw3h-GqlIg" target="_blank" style="color:#009640;text-decoration:none;">YouTube</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

const SPID_HEADER = `<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background-color:#E91E8C;padding:20px 0;">
      <img src="https://www.spid.cl/logo.png" alt="Spid" width="120" style="display:block;" />
    </td>
  </tr>
</table>`;

const SPID_FOOTER = `<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background-color:#E91E8C;padding:20px;font-family:'Montserrat',Arial,sans-serif;font-size:12px;color:#ffffff;">
      <p style="margin:0;">© Spid — spid.cl</p>
    </td>
  </tr>
</table>`;

export const brandShells: Record<BrandId, BrandShell> = {
  "santa-isabel": {
    css: BASE_SFMC_CSS,
    header: SANTA_ISABEL_HEADER,
    footer: SANTA_ISABEL_FOOTER,
    sfmc: true,
  },
  "jumbo": {
    css: BASE_SFMC_CSS,
    header: JUMBO_HEADER,
    footer: JUMBO_FOOTER,
    sfmc: true,
  },
  "spid": {
    css: BASE_SFMC_CSS,
    header: SPID_HEADER,
    footer: SPID_FOOTER,
    sfmc: true,
  },
};
