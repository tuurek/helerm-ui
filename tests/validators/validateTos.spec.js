import { validateTOS, validateTOSWarnings } from 'utils/validators';

import attributeRules from './attributeRules.json';
import validTOS from './validTOS.json';
import TOSmissingSSN from './TOSmissingSSN.json';
import unallowedPublicityClassTOS from './unallowedPublicityClassTOS';
import errorsAndWarningsTOS from './errorsAndWarningsTOS';

describe('(TOS validation)', () => {
  describe('(TOS validation errors) Error validation', () => {
    describe('Valid TOS', () => {
      const errors = validateTOS(validTOS, attributeRules);

      it('Should return an array', () => {
        expect(Array.isArray(errors)).to.equal(true);
      });

      it('Should not have errors', () => {
        expect(errors.length).to.equal(0);
      });
    });

    describe('Single missing value (SocialSecurityNumber)', () => {
      const errors = validateTOS(TOSmissingSSN, attributeRules);

      it('Should return an array', () => {
        expect(Array.isArray(errors)).to.equal(true);
      });

      it('Should have one error', () => {
        expect(errors.length).to.equal(1);
      });
    });

    describe('Single value outside allowed values (PublicityClass)', () => {
      const errors = validateTOS(unallowedPublicityClassTOS, attributeRules);

      it('Should return an array', () => {
        expect(Array.isArray(errors)).to.equal(true);
      });

      it('Should have one error', () => {
        expect(errors.length).to.equal(1);
      });

      it('The error should be PublicityClass', () => {
        expect(errors[0]).to.equal('PublicityClass');
      });
    });

    describe('Value outside allowed values in multi (InformationSystem)', () => {
      const errors = validateTOS(
        {
          ...validTOS,
          attributes: {
            ...validTOS.attributes,
            InformationSystem: ['Ahjo', 'Arvojoukon ulkopuolinen järjestelmä']
          }
        },
        attributeRules
      );

      it('Should return an array', () => {
        expect(Array.isArray(errors)).to.equal(true);
      });

      it('Should not have errors', () => {
        expect(errors.length).to.equal(0);
      });
    });

    describe('"All or none" - RetentionPeriod of -1 shouldn\'t have RetentionPeriodStart', () => {
      const errors = validateTOS(
        {
          ...validTOS,
          attributes: {
            ...validTOS.attributes,
            RetentionPeriod: '-1',
            RetentionPeriodStart: 'Asian lopullinen ratkaisu'
          }
        },
        attributeRules
      );

      it('Should return an array', () => {
        expect(Array.isArray(errors)).to.equal(true);
      });

      it('Should have one error', () => {
        expect(errors.length).to.equal(1);
      });

      it('The error should be RetentionPeriodStart', () => {
        expect(errors[0]).to.equal('RetentionPeriodStart');
      });
    });
    describe('InformationSystem has value outside of allowed values', () => {
      const errors = validateTOS(
        {
          ...validTOS,
          attributes: {
            ...validTOS.attributes,
            InformationSystem: 'Muu järjestelmä'
          }
        },
        attributeRules
      );

      it('Should return an array', () => {
        expect(Array.isArray(errors)).to.equal(true);
      });

      it('Should have no errors', () => {
        expect(errors.length).to.equal(0);
      });
    });
  });

  describe('(TOS validation warnings) Warning validation', () => {
    describe('No warnings', () => {
      const warnings = validateTOSWarnings(validTOS, attributeRules);

      it('Should return an array', () => {
        expect(Array.isArray(warnings)).to.equal(true);
      });

      it('Should not have warnings', () => {
        expect(warnings.length).to.equal(0);
      });
    });

    describe('InformationSystem has value outside of allowed values', () => {
      const warnings = validateTOSWarnings(
        {
          ...validTOS,
          attributes: {
            ...validTOS.attributes,
            InformationSystem: 'Muu järjestelmä'
          }
        },
        attributeRules
      );

      it('Should return an array', () => {
        expect(Array.isArray(warnings)).to.equal(true);
      });

      it('Should have one warning', () => {
        expect(warnings.length).to.equal(1);
      });

      it('The warning should be "InformationSystem"', () => {
        expect(warnings[0]).to.equal('InformationSystem');
      });
    });

    describe('PublicityClass has value outside of allowed values', () => {
      const warnings = validateTOSWarnings(
        unallowedPublicityClassTOS,
        attributeRules
      );

      it('Should return an array', () => {
        expect(Array.isArray(warnings)).to.equal(true);
      });

      it('Should have no warnings', () => {
        expect(warnings.length).to.equal(0);
      });
    });
  });

  describe('(TOS validation errors & warnings)', () => {
    describe('(Errors)', () => {
      const errors = validateTOS(errorsAndWarningsTOS, attributeRules);

      it('Should have two errors', () => {
        expect(errors.length).to.equal(2);
      });

      it('Should have PublicityClass error', () => {
        expect(errors.includes('PublicityClass'));
      });
      it('Should have RetentionPeriodStart error', () => {
        expect(errors.includes('RetentionPeriodStart'));
      });
    });

    describe('(Warnings)', () => {
      const warnings = validateTOSWarnings(
        errorsAndWarningsTOS,
        attributeRules
      );
      console.log(JSON.stringify([...warnings], null, 2));
      it('Should have 1 warning', () => {
        expect(warnings.length).to.equal(1);
      });

      it('Should have InformationSystem warning', () => {
        expect(warnings.includes('InformationSystem'));
      });
    });
  });
});