import { Readable, PassThrough } from 'stream';
import DatasetTransformer, {
  DatasetConfiguration,
} from './dataset-transformer';
import csv from 'csv-parser';
import { DataFactory } from 'n3';
import { Member, RDF_NAMESPACE } from '@lblod/ldes-producer';
const { quad, literal, namedNode } = DataFactory;
interface CSVDatasetConfiguration extends DatasetConfiguration {
  resourceIdField: string;
  propertyMappings: object;
}

export default class CSVTransformer implements DatasetTransformer {
  transform(input: Readable, config: CSVDatasetConfiguration): Readable {
    const resultStream = new PassThrough({ objectMode: true });

    input
      .pipe(csv())
      .on('data', (data) => {
        const id = namedNode(
          encodeURI(config.resourceIdPrefix + data[config.resourceIdField])
        );

        const member = new Member(id);
        member.addQuads(
          quad(member.id, RDF_NAMESPACE('type'), namedNode(config.resourceType))
        );
        Object.entries(config.propertyMappings).forEach(
          ([propertyName, predicateUri]) => {
            member.addQuads(
              quad(
                member.id,
                namedNode(predicateUri),
                literal(data[propertyName])
              )
            );
          }
        );
        resultStream.push(member);
      })
      .on('end', () => {
        resultStream.end();
      });
    return resultStream;
  }
}
