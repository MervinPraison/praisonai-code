import { fileExistsAtPath, isDirectory } from "../../../utils/fs"
import * as path from "path"
import fs from "fs/promises"

/**
 * Converts .praisonaicode/rules file to directory and places old .praisonaicode/rules file inside directory, renaming it
 * Doesn't do anything if .praisonaicode/rules dir already exists or doesn't exist
 * Returns whether there are any uncaught errors
 */
export async function ensureLocalPraisonairulesDirExists(
	praisonairulePath: string,
	defaultRuleFilename: string,
): Promise<boolean> {
	try {
		const exists = await fileExistsAtPath(praisonairulePath)

		if (exists && !(await isDirectory(praisonairulePath))) {
			// logic to convert file into directory, and rename the rules file to {defaultRuleFilename}
			const content = await fs.readFile(praisonairulePath, "utf8")
			const tempPath = praisonairulePath + ".bak"
			await fs.rename(praisonairulePath, tempPath) // create backup
			try {
				await fs.mkdir(praisonairulePath, { recursive: true })
				await fs.writeFile(path.join(praisonairulePath, defaultRuleFilename), content, "utf8")
				await fs.unlink(tempPath).catch(() => {}) // delete backup

				return false // conversion successful with no errors
			} catch (conversionError) {
				// attempt to restore backup on conversion failure
				try {
					await fs.rm(praisonairulePath, { recursive: true, force: true }).catch(() => {})
					await fs.rename(tempPath, praisonairulePath) // restore backup
				} catch (restoreError) {}
				return true // in either case here we consider this an error
			}
		}
		// exists and is a dir or doesn't exist, either of these cases we dont need to handle here
		return false
	} catch (error) {
		return true
	}
}
