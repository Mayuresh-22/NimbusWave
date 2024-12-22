import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

class CloudinaryService {

	constructor() {
		// Configuration
		cloudinary.config({
			cloud_name: 'dkb6qr7ms',
			api_key: '683921765365997',
			api_secret: '<your_api_secret>' // Click 'View API Keys' above to copy your API secret
		});
	}

	async uploadFile(file: File): Promise<any> {
		return new Promise(async (resolve, reject) => {
			const uploadStream = cloudinary.uploader.upload_stream((error, result) => {
				if (error) {
					return reject(error);
				}
				resolve(result);
			});
	
			const readableStream = new Readable();
			readableStream._read = () => {}; // _read is required but you can noop it
			readableStream.push(Buffer.from(await file.arrayBuffer()));
			readableStream.push(null);
	
			readableStream.pipe(uploadStream);
		});
	}
}

export default new CloudinaryService();